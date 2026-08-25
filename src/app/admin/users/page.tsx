'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Search, 
  MoreVertical, 
  UserMinus, 
  UserCheck,
  Mail,
  Users,
  Eye,
  TrendingUp,
  Package
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const db = useFirestore();
  
  const usersQuery = useMemoFirebase(() => {
    return db ? collection(db, 'users') : null;
  }, [db]);

  const { data: users, loading } = useCollection(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => 
      u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a,b) => (b.totalSpent || 0) - (a.totalSpent || 0));
  }, [users, searchTerm]);

  const toggleUserStatus = async (id: string, currentStatus: boolean) => {
    if (!db) return;
    const ref = doc(db, 'users', id);
    await updateDoc(ref, { isActive: !currentStatus });
  };

  const aggregateStats = useMemo(() => {
    if (!users) return { totalLtv: 0, highValueCount: 0 };
    const ltv = users.reduce((sum, u) => sum + (u.totalSpent || 0), 0) / 100;
    const highValue = users.filter(u => (u.totalSpent || 0) > 500000).length; // Above 5000 INR
    return { totalLtv: ltv, highValueCount: highValue };
  }, [users]);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg md:text-xl font-semibold">Users</h1>
        <p className="text-xs text-muted-foreground">Verified member database and portfolio intelligence.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl shadow-sm p-4">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground">Cumulative LTV</p>
              <h3 className="text-xl md:text-2xl font-semibold mt-1">₹{aggregateStats.totalLtv.toLocaleString('en-IN')}</h3>
            </div>
            <TrendingUp className="h-8 w-8 text-primary opacity-20" />
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm p-4">
          <CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-muted-foreground">High Value Members</p>
              <h3 className="text-xl md:text-2xl font-semibold mt-1">{aggregateStats.highValueCount}</h3>
            </div>
            <Users className="h-8 w-8 text-muted-foreground opacity-20" />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 rounded-lg"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse bg-muted rounded-lg" />
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="pl-4">Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Portfolio Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: any) => (
                    <TableRow key={user.uid} className="transition-colors">
                      <TableCell className="pl-4 px-3 py-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-7 w-7 border">
                            <AvatarImage src={user.photoURL} alt={user.displayName} />
                            <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium leading-none">{user.displayName || 'Anonymous User'}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Badge variant={user.role === 'admin' || user.role === 'super-admin' ? 'default' : 'outline'} className="text-[10px] font-medium px-1.5 py-0">
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-primary tabular-nums">₹{((user.totalSpent || 0) / 100).toLocaleString('en-IN')}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Package className="h-2 w-2" /> {user.orderCount || 0} orders
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Badge variant={user.isActive !== false ? 'outline' : 'destructive'} className={cn(
                          "text-[10px] font-medium px-1.5 py-0 border-none",
                          user.isActive !== false ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
                        )}>
                          {user.isActive !== false ? 'Active' : 'Suspended'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4 px-3 py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-[10px] font-medium text-muted-foreground p-2">Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild className="rounded-md text-xs cursor-pointer">
                              <Link href={`/admin/users/${user.uid}`} className="flex items-center gap-2">
                                <Eye className="h-4 w-4" /> Customer Profile
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="rounded-md text-xs cursor-pointer">
                              <a href={`mailto:${user.email}`} className="flex items-center gap-2">
                                <Mail className="h-4 w-4" /> Contact Member
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleUserStatus(user.uid, user.isActive !== false)} className="rounded-md text-xs cursor-pointer focus:bg-destructive/10 focus:text-destructive">
                              {user.isActive !== false ? (
                                <div className="flex items-center gap-2">
                                  <UserMinus className="h-4 w-4" /> Suspend Access
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-green-600">
                                  <UserCheck className="h-4 w-4" /> Restore Access
                                </div>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-60 flex-col items-center justify-center text-center p-8">
              <Users className="h-10 w-10 text-muted-foreground mb-3 opacity-20" />
              <h3 className="text-sm font-semibold">No members found</h3>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
