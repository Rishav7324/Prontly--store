'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Search, 
  MoreVertical, 
  ShieldCheck, 
  UserMinus, 
  UserCheck,
  Mail,
  Users
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

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const db = useFirestore();
  
  const usersQuery = useMemoFirebase(() => {
    return db ? query(collection(db, 'users'), orderBy('createdAt', 'desc')) : null;
  }, [db]);

  const { data: users, loading } = useCollection(usersQuery);

  const filteredUsers = users?.filter(u => 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleUserStatus = async (id: string, currentStatus: boolean) => {
    if (!db) return;
    const ref = doc(db, 'users', id);
    await updateDoc(ref, { isActive: !currentStatus });
  };

  const changeRole = async (id: string, newRole: string) => {
    if (!db) return;
    const ref = doc(db, 'users', id);
    await updateDoc(ref, { role: newRole });
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">Users</h1>
        <p className="text-muted-foreground">Manage customer accounts and staff permissions.</p>
      </header>

      <Card>
        <CardHeader className="p-4 border-b">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 w-full animate-pulse bg-muted rounded" />
              ))}
            </div>
          ) : filteredUsers && filteredUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user: any) => (
                  <TableRow key={user.uid}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.photoURL} alt={user.displayName} />
                          <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-bold">{user.displayName || 'Anonymous User'}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' || user.role === 'super-admin' ? 'default' : 'outline'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell className="font-bold">{user.orderCount || 0}</TableCell>
                    <TableCell>
                      <Badge variant={user.isActive !== false ? 'outline' : 'destructive'} className={user.isActive !== false ? "text-green-500 border-green-500/50" : ""}>
                        {user.isActive !== false ? 'Active' : 'Suspended'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Manage Permissions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => changeRole(user.uid, 'customer')}>
                            Set as Customer
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => changeRole(user.uid, 'editor')}>
                            Set as Editor
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => changeRole(user.uid, 'admin')}>
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Set as Admin
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <a href={`mailto:${user.email}`} className="flex items-center">
                              <Mail className="mr-2 h-4 w-4" />
                              Contact User
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleUserStatus(user.uid, user.isActive !== false)}>
                            {user.isActive !== false ? (
                              <div className="flex items-center text-destructive">
                                <UserMinus className="mr-2 h-4 w-4" />
                                Suspend Account
                              </div>
                            ) : (
                              <div className="flex items-center text-green-500">
                                <UserCheck className="mr-2 h-4 w-4" />
                                Reactivate Account
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
              <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-xl font-bold font-headline">No users found</h3>
              <p className="text-muted-foreground">Try a different search term or wait for new signups.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
