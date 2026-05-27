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
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">Customer Registry</h1>
        <p className="text-muted-foreground">Verified member database and portfolio intelligence.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20 rounded-[2rem]">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">Cumulative LTV</p>
              <h3 className="text-2xl font-bold font-headline mt-1">₹{aggregateStats.totalLtv.toLocaleString('en-IN')}</h3>
            </div>
            <TrendingUp className="h-10 w-10 text-primary opacity-20" />
          </CardContent>
        </Card>
        <Card className="bg-card/30 border-white/5 rounded-[2rem]">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">High Value Members</p>
              <h3 className="text-2xl font-bold font-headline mt-1">{aggregateStats.highValueCount}</h3>
            </div>
            <Users className="h-10 w-10 text-muted-foreground opacity-10" />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2.5rem] border-white/5 bg-card/30 overflow-hidden">
        <CardHeader className="p-4 border-b border-white/5">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background/50 border-white/5 rounded-xl h-11"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 w-full animate-pulse bg-muted rounded-2xl" />
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-white/5">
                  <TableHead className="pl-8">Verified Identity</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Portfolio Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-8">Audit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user: any) => (
                  <TableRow key={user.uid} className="hover:bg-white/5 transition-colors border-white/5 group">
                    <TableCell className="pl-8">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border border-white/5 shadow-sm">
                          <AvatarImage src={user.photoURL} alt={user.displayName} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{user.displayName || 'Anonymous User'}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' || user.role === 'super-admin' ? 'default' : 'outline'} className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-primary">₹{((user.totalSpent || 0) / 100).toLocaleString('en-IN')}</span>
                        <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                          <Package className="h-2 w-2" /> {user.orderCount || 0} Assets
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive !== false ? 'outline' : 'destructive'} className={cn(
                        "text-[9px] uppercase font-black px-2 py-0.5 border-none",
                        user.isActive !== false ? "bg-green-500/10 text-green-500" : "bg-destructive/10 text-destructive"
                      )}>
                        {user.isActive !== false ? 'Active' : 'Suspended'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white/5">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-card border-white/10 rounded-2xl p-2 shadow-2xl">
                          <DropdownMenuLabel className="text-[10px] uppercase font-black tracking-widest p-3">Intelligence</DropdownMenuLabel>
                          <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/10 focus:text-primary p-3">
                            <Link href={`/admin/users/${user.uid}`} className="flex items-center">
                              <Eye className="mr-3 h-4 w-4" /> Customer Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/5" />
                          <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/10 focus:text-primary p-3">
                            <a href={`mailto:${user.email}`} className="flex items-center">
                              <Mail className="mr-3 h-4 w-4" /> Contact Member
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleUserStatus(user.uid, user.isActive !== false)} className="rounded-xl focus:bg-destructive/10 focus:text-destructive p-3 cursor-pointer">
                            {user.isActive !== false ? (
                              <div className="flex items-center">
                                <UserMinus className="mr-3 h-4 w-4" /> Suspend Access
                              </div>
                            ) : (
                              <div className="flex items-center text-green-500">
                                <UserCheck className="mr-3 h-4 w-4" /> Restore Access
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
          ) : (
            <div className="flex h-60 flex-col items-center justify-center text-center p-8">
              <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-10" />
              <h3 className="text-xl font-bold font-headline">No members found</h3>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
