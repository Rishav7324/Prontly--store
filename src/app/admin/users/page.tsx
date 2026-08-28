'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Search,
  MoreVertical,
  UserMinus,
  UserCheck,
  Mail,
  Users,
  Eye,
  TrendingUp,
  Package,
  X,
  ShieldCheck,
  UserCheck2
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
import { toast } from '@/hooks/use-toast';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  return json.success ? json.data : [];
};

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => fetcher('/api/admin/users'),
    refetchInterval: 30000,
  });

  const filteredUsers = useMemo(() => {
    return (users as any[])
      .filter(u =>
        u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a: any, b: any) => (b.totalSpent || 0) - (a.totalSpent || 0));
  }, [users, searchTerm]);

  const toggleUserStatus = async (uid: string, currentStatus: boolean, name: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, isActive: !currentStatus }),
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ 
        title: currentStatus ? "Access Suspended" : "Access Restored",
        description: `${name || 'User'} has been ${currentStatus ? 'suspended' : 'reactivated'}.`
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed", description: "Could not update user state." });
    }
  };

  const aggregateStats = useMemo(() => {
    const list = users as any[];
    const ltv = list.reduce((sum, u) => sum + (u.totalSpent || 0), 0) / 100;
    const highValue = list.filter(u => (u.totalSpent || 0) > 500000).length; // Above 5000 INR
    return { totalLtv: ltv, totalUsers: list.length, highValueCount: highValue };
  }, [users]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold text-accent mb-1.5 uppercase">
            USER DIRECTORY
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-headline">
            Customer Accounts
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Registered customer profiles, cumulative lifetime spend, and account roles.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-border/80 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Cumulative LTV</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-headline mt-1">
              ₹{aggregateStats.totalLtv.toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Total customer revenue generated</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-3xl border border-border/80 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Accounts</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-headline mt-1">
              {aggregateStats.totalUsers}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Verified user records</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-3xl border border-border/80 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">High Value VIPs</span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-headline mt-1">
              {aggregateStats.highValueCount}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Customers spending &gt; ₹5,000</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="rounded-3xl border border-border/80 bg-white shadow-xs overflow-hidden">
        
        <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search customers by name, email, role…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9.5 pr-8 h-10 rounded-2xl bg-white border-border/80 text-xs focus-visible:ring-1 focus-visible:ring-accent shadow-2xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <p className="text-xs text-muted-foreground font-medium shrink-0">
              Showing {filteredUsers.length} of {users.length} members
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 w-full animate-pulse bg-muted rounded-2xl" />
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="px-6 py-3.5 text-xs font-bold text-muted-foreground">Customer Profile</TableHead>
                      <TableHead className="px-6 py-3.5 text-xs font-bold text-muted-foreground">Permission Role</TableHead>
                      <TableHead className="px-6 py-3.5 text-xs font-bold text-muted-foreground">Lifetime Spend</TableHead>
                      <TableHead className="px-6 py-3.5 text-xs font-bold text-muted-foreground">Account Status</TableHead>
                      <TableHead className="px-6 py-3.5 text-right text-xs font-bold text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: any) => (
                      <TableRow key={user.uid} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-border/70 shadow-2xs">
                              <AvatarImage src={user.photoUrl || user.photoURL} alt={user.displayName} />
                              <AvatarFallback className="bg-accent/15 text-accent font-bold text-xs">
                                {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-xs sm:text-sm font-bold text-foreground leading-none">{user.displayName || 'Customer'}</span>
                              <span className="text-[11px] text-muted-foreground font-mono mt-1">{user.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-3.5">
                          <Badge variant={user.role === 'admin' || user.role === 'super-admin' ? 'default' : 'outline'} className="text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize">
                            {user.role || 'customer'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-3.5">
                          <div className="flex flex-col">
                            <span className="text-sm font-extrabold text-foreground font-headline tabular-nums">
                              ₹{((user.totalSpent || 0) / 100).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                              <Package className="h-3 w-3" /> {user.orderCount || 0} orders
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-3.5">
                          <Badge variant="outline" className={cn(
                            "text-[10px] font-bold px-2.5 py-0.5 rounded-full border-none",
                            user.isActive !== false ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                          )}>
                            {user.isActive !== false ? 'Active' : 'Suspended'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-3.5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8.5 w-8.5 rounded-xl border border-transparent hover:border-border/70">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-2xl p-1.5 shadow-lg border-border/80">
                              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-1">Options</DropdownMenuLabel>
                              <DropdownMenuItem asChild className="rounded-xl text-xs font-medium cursor-pointer p-2">
                                <Link href={`/admin/users/${user.uid}`} className="flex items-center gap-2">
                                  <Eye className="h-4 w-4 text-accent" /> Customer Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild className="rounded-xl text-xs font-medium cursor-pointer p-2">
                                <a href={`mailto:${user.email}`} className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" /> Send Direct Email
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => toggleUserStatus(user.uid, user.isActive !== false, user.displayName)} 
                                className="rounded-xl text-xs font-semibold cursor-pointer p-2 focus:bg-destructive/10 focus:text-destructive"
                              >
                                {user.isActive !== false ? (
                                  <div className="flex items-center gap-2 text-rose-600">
                                    <UserMinus className="h-4 w-4" /> Suspend Access
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-emerald-600">
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

              {/* Mobile Card Stack */}
              <div className="md:hidden divide-y divide-border/60">
                {filteredUsers.map((user: any) => (
                  <div key={user.uid} className="p-4 space-y-2.5 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border/70 shrink-0">
                        <AvatarImage src={user.photoUrl || user.photoURL} alt={user.displayName} />
                        <AvatarFallback className="bg-accent/15 text-accent font-bold text-xs">
                          {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-xs text-foreground truncate">{user.displayName || 'Customer'}</p>
                          <Badge variant="outline" className={cn(
                            "text-[9px] font-bold px-2 py-0.5 rounded-full border-none",
                            user.isActive !== false ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                          )}>
                            {user.isActive !== false ? 'Active' : 'Suspended'}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground">LTV:</span>{' '}
                        <span className="font-extrabold text-foreground font-headline">
                          ₹{((user.totalSpent || 0) / 100).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1.5">({user.orderCount || 0} orders)</span>
                      </div>

                      <Button asChild variant="outline" size="sm" className="h-8 rounded-xl text-xs px-3">
                        <Link href={`/admin/users/${user.uid}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-56 flex-col items-center justify-center text-center p-8">
              <Users className="h-12 w-12 text-muted-foreground mb-3 opacity-25" />
              <h3 className="text-sm font-bold text-foreground">No Members Found</h3>
              <p className="text-xs text-muted-foreground mt-1">No user records matched your search query.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
