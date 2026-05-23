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
  ShieldCheck, 
  Star, 
  Sparkles, 
  ArrowUpRight,
  User as UserIcon,
  Phone
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
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Member not found</h1>
        <Button asChild><Link href="/admin/users">Back to Members</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="flex items-center gap-6">
        <Button variant="ghost" size="icon" asChild className="rounded-full bg-white/5 h-14 w-14">
          <Link href="/admin/users"><ChevronLeft className="h-6 w-6" /></Link>
        </Button>
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20 border-4 border-primary/20 shadow-2xl">
            <AvatarImage src={profile.photoURL} />
            <AvatarFallback className="text-2xl font-bold text-primary bg-primary/10">{profile.displayName?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-4xl font-bold font-headline">{profile.displayName || 'Anonymous User'}</h1>
            <p className="text-muted-foreground text-lg">{profile.email}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="h-16 w-16 text-primary" />
          </div>
          <CardContent className="pt-10">
            <p className="text-xs uppercase font-bold tracking-widest text-primary mb-2">Lifetime Value (LTV)</p>
            <h3 className="text-5xl font-bold font-headline">₹{(stats.total / 100).toLocaleString('en-IN')}</h3>
          </CardContent>
        </Card>
        <Card className="rounded-[2.5rem] border-white/5 bg-card/30 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShoppingBag className="h-16 w-16 text-muted-foreground" />
          </div>
          <CardContent className="pt-10">
            <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground mb-2">Total Order Density</p>
            <h3 className="text-5xl font-bold font-headline">{stats.count} Transactions</h3>
          </CardContent>
        </Card>
        <Card className="bg-accent/5 border-accent/20 rounded-[2.5rem] p-8">
          <div className="flex items-center gap-3 text-accent mb-4">
            <Sparkles className="h-5 w-5" />
            <h4 className="font-bold text-sm uppercase tracking-widest">Retention Score</h4>
          </div>
          <p className="text-sm font-medium leading-relaxed italic text-foreground/80">
            {stats.count > 5 
              ? "Super User. High LTV potential. Recommend Enterprise-tier source file updates." 
              : stats.count > 0 
              ? "Active Creator. Suggest specialized bundle based on previous category affinity."
              : "New User. Welcome sequence finalized. Monitoring lead velocity."}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          <Card className="rounded-[2.5rem] border-white/5 bg-card/30 overflow-hidden shadow-2xl">
            <CardHeader className="p-8 bg-muted/30 border-b border-white/5">
              <CardTitle className="text-xl font-headline">Purchase Ledger</CardTitle>
              <CardDescription>Verified cryptographic order records for this member.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-8 py-5 text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground">ID</th>
                      <th className="px-8 py-5 text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Execution Date</th>
                      <th className="px-8 py-5 text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground">State</th>
                      <th className="px-8 py-5 text-right font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Value</th>
                      <th className="px-8 py-5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {ordersLoading ? (
                      [...Array(3)].map((_, i) => (
                        <tr key={i} className="animate-pulse"><td colSpan={5} className="h-16 bg-muted/20"></td></tr>
                      ))
                    ) : orders?.map((order: any) => (
                      <tr key={order.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-8 py-6 font-mono text-xs text-primary font-bold uppercase tracking-widest">#{order.id.slice(-8)}</td>
                        <td className="px-8 py-6 text-muted-foreground font-medium">
                          {order.createdAt ? format(new Date(order.createdAt.toDate()), 'MMM dd, yyyy') : 'N/A'}
                        </td>
                        <td className="px-8 py-6">
                          <Badge variant={order.status === 'paid' ? 'default' : 'secondary'} className="text-[9px] uppercase font-black tracking-[0.2em] px-3 py-1 rounded-lg">
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-8 py-6 text-right font-bold text-lg">₹{(order.total / 100).toLocaleString('en-IN')}</td>
                        <td className="px-8 py-6 text-right">
                          <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-primary/10 text-primary">
                            <Link href={`/admin/orders/${order.id}`}><ArrowUpRight className="h-5 w-5" /></Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {!ordersLoading && orders?.length === 0 && (
                      <tr><td colSpan={5} className="px-8 py-20 text-center text-muted-foreground italic font-medium">No recorded transactions for this profile.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="rounded-[2.5rem] border-white/5 bg-card/30 p-8 shadow-2xl">
            <h3 className="text-xl font-bold font-headline mb-8">Identity Attributes</h3>
            <div className="space-y-8">
              <div className="flex items-center gap-5">
                <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center border border-white/10 shadow-inner">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Verified Email</p>
                  <p className="text-sm font-bold truncate">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center border border-white/10 shadow-inner">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Member Since</p>
                  <p className="text-sm font-bold">
                    {profile.createdAt 
                      ? format(profile.createdAt.toDate ? profile.createdAt.toDate() : new Date(profile.createdAt), 'MMMM yyyy') 
                      : 'Recently'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center border border-white/10 shadow-inner">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Global Role</p>
                  <Badge variant="outline" className="mt-2 rounded-lg border-primary/20 text-primary uppercase text-[9px] font-bold tracking-widest">{profile.role}</Badge>
                </div>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-5">
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center border border-white/10 shadow-inner">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Contact Phone</p>
                    <p className="text-sm font-bold">{profile.phone}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="pt-10 mt-10 border-t border-white/5">
              <Button className="w-full h-14 rounded-2xl gap-3 font-bold text-lg" variant="outline" asChild>
                <a href={`mailto:${profile.email}`}>
                  <Mail className="h-5 w-5" /> Outreach Member
                </a>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
