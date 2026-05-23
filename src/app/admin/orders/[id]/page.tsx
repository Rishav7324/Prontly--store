'use client';

import { use, useMemo } from 'react';
import { useDoc, useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  Loader2, 
  User, 
  Mail, 
  ShoppingBag, 
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useFirestore();

  const orderRef = useMemo(() => (db ? doc(db, 'orders', id) : null), [db, id]);
  const { data: order, loading } = useDoc(orderRef);

  const updateStatus = async (newStatus: string) => {
    if (!db || !order) return;
    try {
      await updateDoc(doc(db, 'orders', id), { status: newStatus });
      toast({ title: "Order State Modified", description: `Transitioned to ${newStatus}.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Transition Error" });
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!order) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4 font-headline">Order Ledger Missing</h1>
        <Button asChild className="rounded-xl"><Link href="/admin/orders">Back to Orders</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-white/5 h-14 w-14">
            <Link href="/admin/orders"><ChevronLeft className="h-6 w-6" /></Link>
          </Button>
          <div>
            <h1 className="text-4xl font-bold font-headline">Order Console</h1>
            <p className="text-muted-foreground text-sm uppercase tracking-widest font-mono font-bold mt-1">Record Index: {id.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-14 px-8 rounded-2xl gap-3 border-white/10 font-bold" onClick={() => window.print()}>
            <Printer className="h-5 w-5" /> Print Audit
          </Button>
          <div className="flex bg-muted/40 p-1.5 rounded-2xl border border-white/5">
            <Button size="sm" className="rounded-xl h-10 px-6 font-bold" variant={order.status === 'paid' ? 'default' : 'ghost'} onClick={() => updateStatus('paid')}>Paid</Button>
            <Button size="sm" className="rounded-xl h-10 px-6 font-bold" variant={order.status === 'refunded' ? 'destructive' : 'ghost'} onClick={() => updateStatus('refunded')}>Refund</Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <Card className="rounded-[2.5rem] border-white/5 bg-card/30 overflow-hidden shadow-2xl">
            <CardHeader className="p-10 bg-muted/30 border-b border-white/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-headline">Customer Entity</CardTitle>
                <CardDescription>Verified purchasing profile identification.</CardDescription>
              </div>
              <Badge variant="outline" className="font-mono px-4 py-1.5 rounded-lg border-primary/20 text-primary font-bold">UID: {order.userId.slice(-8)}</Badge>
            </CardHeader>
            <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div className="flex items-center gap-5">
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center border border-white/10 shadow-inner">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Public Name</p>
                    <p className="text-lg font-bold">{order.userName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center border border-white/10 shadow-inner">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Electronic Address</p>
                    <p className="text-lg font-bold">{order.userEmail}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-8">
                <div className="flex items-center gap-5">
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center border border-white/10 shadow-inner">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Execution Timestamp</p>
                    <p className="text-lg font-bold">{format(new Date(order.createdAt.toDate()), 'PPP p')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center border border-white/10 shadow-inner">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Validation State</p>
                    <Badge className="bg-green-500/10 text-green-500 border-none font-black uppercase text-[9px] tracking-widest px-3 py-1 rounded-lg">Encrypted Verified</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-white/5 bg-card/30 overflow-hidden shadow-2xl">
            <CardHeader className="p-8 bg-muted/30 border-b border-white/5">
              <CardTitle className="text-xl font-headline">Line Item Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-white/5">
                    <tr>
                      <th className="px-10 py-5 text-left font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Asset Class</th>
                      <th className="px-10 py-5 text-center font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Density</th>
                      <th className="px-10 py-5 text-right font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Unit Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {order.items?.map((item: any) => (
                      <tr key={item.productId} className="hover:bg-white/5 transition-colors">
                        <td className="px-10 py-6">
                          <div className="flex items-center gap-5">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                              <ShoppingBag className="h-5 w-5" />
                            </div>
                            <span className="font-bold text-base">{item.productName}</span>
                          </div>
                        </td>
                        <td className="px-10 py-6 text-center font-mono font-bold text-muted-foreground">{item.quantity}</td>
                        <td className="px-10 py-6 text-right font-headline font-bold text-lg">₹{(item.price / 100).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-10">
          <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <CardHeader className="p-8 bg-primary/10 border-b border-primary/10"><CardTitle className="text-xl font-headline">Economic Recap</CardTitle></CardHeader>
            <CardContent className="p-10 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-muted-foreground">Gross Subtotal</span>
                  <span>₹{(order.subtotal / 100).toLocaleString('en-IN')}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between items-center text-sm font-bold text-green-500">
                    <span>Discount Incentive</span>
                    <span>-₹{(order.discount / 100).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="pt-8 mt-4 border-t border-white/10 flex justify-between items-baseline">
                  <span className="font-bold text-xl">Net Value</span>
                  <span className="text-4xl font-bold text-primary">₹{(order.total / 100).toLocaleString('en-IN')}</span>
                </div>
                <div className="text-[10px] text-center uppercase tracking-widest font-black opacity-30 pt-4">No Indirect Taxes Applied</div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2.5rem] border-white/5 bg-card/30 p-8 shadow-xl">
            <CardHeader className="p-0 mb-8"><CardTitle className="text-lg font-headline">Execution Logs</CardTitle></CardHeader>
            <div className="space-y-8">
              <div className="flex gap-6 items-start relative">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 border border-green-500/30"><CheckCircle2 className="h-5 w-5 text-green-500" /></div>
                  <div className="w-[1px] h-10 bg-white/10 mt-2" />
                </div>
                <div className="pt-1">
                  <p className="text-xs font-black uppercase tracking-widest text-foreground">Transaction Logged</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-1">{format(new Date(order.createdAt.toDate()), 'MMM dd, HH:mm:ss')}</p>
                </div>
              </div>
              <div className="flex gap-6 items-start">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border ${order.status === 'paid' ? 'bg-green-500/20 border-green-500/30' : 'bg-muted border-white/5'}`}>
                  {order.status === 'paid' ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Clock className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="pt-1">
                  <p className="text-xs font-black uppercase tracking-widest text-foreground">Payment Authority</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{order.status === 'paid' ? 'Authenticated via Razorpay Node' : 'Awaiting confirmation...'}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}