'use client';

import { use, useMemo } from 'react';
import { useDoc, useFirestore, useCollection } from '@/firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ChevronLeft, 
  Loader2, 
  ShoppingBag, 
  Mail, 
  Calendar, 
  TrendingUp, 
  CreditCard,
  ShieldCheck,
  Star,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useFirestore();

  const userRef = useMemo(() => (db ? doc(db, 'users', id) : null), [db, id]);
  const { data: profile, loading: userLoading } = useDoc(userRef);

  const ordersQuery = useMemo(() => {
    if (!db || !id) return null;
    return query(collection(db, 'orders'), where('userId', '==', id), orderBy('createdAt', 'desc'));
  }, [db, id]);

  const { data: orders, loading: ordersLoading } = useCollection(ordersQuery);

  const stats = useMemo(() => {
    if (!orders) return { count: 0, total: 0 };
    const paidOrders = orders.filter(o => o.status === 'paid');
    return {
      count: paidOrders.length,
      total: paidOrders.reduce((sum, o) => sum + (o.total || 0), 0)
    };
  }, [orders]);

  if (userLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">User not found</h1>
        <Button asChild><Link href="/admin/users">Back to Users</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/users"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarImage src={profile.photoURL} />
            <AvatarFallback>{profile.displayName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold font-headline">{profile.displayName || 'Anonymous User'}</h1>
            <p className="text-muted-foreground text-sm">{profile.email}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-primary">Lifetime Value</p>
                <h3 className="text-3xl font-bold">₹{(stats.total / 100).toLocaleString('en-IN')}</h3>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Order Volume</p>
                <h3 className="text-3xl font-bold">{stats.count} Orders</h3>
              </div>
              <ShoppingBag className="h-8 w-8 text-muted-foreground opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-accent/5 border-accent/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs flex items-center gap-2 text-accent">
              <Sparkles className="h-3 w-3" /> AI Retention Insight
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm font-medium text-foreground/80 leading-relaxed">
              {stats.count > 3 
                ? "Power user. Highly likely to recommend. Consider providing an 'early access' tag." 
                : stats.count > 0 
                ? "Active customer. Suggest a bundle based on their recent category affinity."
                : "New potential lead. Automated welcome sequence complete."}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
              <CardDescription>Detailed transaction log for this customer.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left">Order ID</th>
                      <th className="px-6 py-4 text-left">Date</th>
                      <th className="px-6 py-4 text-left">Status</th>
                      <th className="px-6 py-4 text-right">Amount</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {ordersLoading ? (
                      [...Array(3)].map((_, i) => (
                        <tr key={i} className="animate-pulse"><td colSpan={5} className="h-12 bg-muted/20"></td></tr>
                      ))
                    ) : orders?.map((order: any) => (
                      <tr key={order.id} className="hover:bg-muted/5 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-primary uppercase">#{order.id.slice(-8)}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {order.createdAt ? format(new Date(order.createdAt.toDate()), 'MMM dd, yyyy') : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={order.status === 'paid' ? 'default' : 'secondary'} className="text-[10px] uppercase font-bold">
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right font-bold">₹{(order.total / 100).toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/orders/${order.id}`}><ArrowUpRight className="h-4 w-4" /></Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!ordersLoading && orders?.length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">No purchases yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Attributes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted"><Mail className="h-4 w-4 text-muted-foreground" /></div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Primary Email</p>
                    <p className="text-sm font-bold truncate">{profile.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted"><Calendar className="h-4 w-4 text-muted-foreground" /></div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Joined Store On</p>
                    <p className="text-sm font-bold">{profile.createdAt ? format(new Date(profile.createdAt), 'MMMM yyyy') : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted"><ShieldCheck className="h-4 w-4 text-muted-foreground" /></div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">System Role</p>
                    <Badge variant="outline" className="mt-1">{profile.role}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted"><CreditCard className="h-4 w-4 text-muted-foreground" /></div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">GST Identification</p>
                    <p className="text-sm font-mono text-primary">{profile.gstNumber || 'None Provided'}</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t">
                <Button className="w-full gap-2" variant="outline" asChild>
                  <a href={`mailto:${profile.email}`}>
                    <Mail className="h-4 w-4" /> Send Direct Email
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
