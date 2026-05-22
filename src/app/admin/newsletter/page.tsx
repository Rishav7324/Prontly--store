'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Trash2, 
  Mail, 
  Download,
  Calendar,
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
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export default function AdminNewsletter() {
  const [searchTerm, setSearchTerm] = useState('');
  const db = useFirestore();
  
  const subscribersQuery = useMemoFirebase(() => {
    return db ? query(collection(db, 'newsletter_subscribers'), orderBy('createdAt', 'desc')) : null;
  }, [db]);

  const { data: subscribers, loading } = useCollection(subscribersQuery);

  const filteredSubscribers = subscribers?.filter(s => 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deleteSubscriber = async (id: string) => {
    if (!db || !confirm('Remove this email from the list?')) return;
    
    const docRef = doc(db, 'newsletter_subscribers', id);
    deleteDoc(docRef).catch(async () => {
      const permissionError = new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    });
    
    toast({ title: "Subscriber Removed", description: "Email has been deleted." });
  };

  const exportCSV = () => {
    if (!subscribers) return;
    const headers = ['Email', 'Date Subscribed'];
    const rows = subscribers.map(s => [
      s.email,
      s.createdAt ? format(new Date(s.createdAt.toDate()), 'yyyy-MM-dd') : 'N/A'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `subscribers_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Newsletter</h1>
          <p className="text-muted-foreground">Manage your audience and export email lists.</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-headline">{subscribers?.length || 0}</div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">Active Audience</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 border-b">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by email..." 
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
          ) : filteredSubscribers && filteredSubscribers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email Address</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Joined On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscribers.map((sub: any) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <Mail className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-bold">{sub.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs uppercase font-bold text-muted-foreground">
                      {sub.source || 'Website'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {sub.createdAt ? format(new Date(sub.createdAt.toDate()), 'MMM dd, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => deleteSubscriber(sub.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-60 flex-col items-center justify-center text-center p-8">
              <Mail className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-xl font-bold font-headline">No subscribers yet</h3>
              <p className="text-muted-foreground mb-6">Users who sign up via your footer or popups will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
