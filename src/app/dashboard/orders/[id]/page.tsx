'use client';

import { use, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  Download, 
  ExternalLink, 
  Loader2, 
  Printer, 
  ShieldCheck, 
  Package,
  Receipt
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useUser();
  const db = useFirestore();

  const orderRef = useMemo(() => (db ? doc(db, 'orders', id) : null), [db, id]);
  const { data: order, loading } = useDoc(orderRef);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!order || (user && order.userId !== user.uid)) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-4xl font-bold font-headline mb-4">Receipt Not Found</h1>
          <Button asChild className="rounded-2xl h-14 px-10"><Link href="/dashboard">Return to Library</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-16 max-w-5xl">
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" asChild className="rounded-full bg-white/5 h-14 w-14">
              <Link href="/dashboard"><ChevronLeft className="h-6 w-6" /></Link>
            </Button>
            <div>
              <h1 className="text-4xl font-bold font-headline">Order Overview</h1>
              <p className="text-muted-foreground text-sm uppercase tracking-widest font-mono font-bold mt-1">Transaction ID: {id.toUpperCase()}</p>
            </div>
          </div>
          <Button variant="outline" className="h-14 px-8 rounded-2xl gap-3 border-white/10 font-bold" onClick={() => window.print()}>
            <Printer className="h-5 w-5" />
            Print Receipt
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            <Card className="bg-card/40 border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <CardHeader className="bg-muted/30 border-b border-white/5 p-8">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl font-headline">Assets in Order</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                  {order.items?.map((item: any) => (
                    <div key={item.productId} className="p-8 flex items-center justify-between gap-6 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center border border-white/10 shrink-0">
                          <Receipt className="h-8 w-8 text-muted-foreground opacity-50" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">{item.productName}</p>
                          <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Lifetime License • Perpetual Usage</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">₹{(item.price / 100).toLocaleString('en-IN')}</p>
                        <Link href={`/products/${item.productId}`} className="text-[10px] text-primary uppercase font-bold tracking-widest hover:underline mt-1 block">View Specs</Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-card/40 border-white/5 rounded-[2.5rem] p-8">
                <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">Customer Ledger</h4>
                <div className="space-y-1">
                  <p className="text-xl font-bold">{order.userName}</p>
                  <p className="text-muted-foreground">{order.userEmail}</p>
                </div>
                <div className="mt-10 pt-6 border-t border-white/5">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Billing Method</p>
                  <p className="text-sm font-medium mt-1">Razorpay Verified Payment</p>
                </div>
              </Card>
              
              <Card className="bg-card/40 border-white/5 rounded-[2.5rem] p-8">
                <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">Execution Status</h4>
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                      <ShieldCheck className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="font-bold text-green-500 uppercase text-xs tracking-[0.2em]">{order.status}</p>
                      <p className="text-xs text-muted-foreground font-medium mt-0.5">Asset Delivery Confirmed</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed italic">
                    Transaction processed on {order.paidAt ? format(new Date(order.paidAt.toDate()), 'PPP p') : 'Recently'}. Source files are stored in Global R2 edge.
                  </p>
                </div>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <CardHeader className="bg-primary/10 border-b border-primary/10 p-8">
                <CardTitle className="text-xl font-headline">Pricing Audit</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Subtotal</span>
                    <span className="font-bold">₹{(order.subtotal / 100).toLocaleString('en-IN')}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between items-center text-sm font-bold text-green-500">
                      <span>Discount ({order.couponCode})</span>
                      <span>-₹{(order.discount / 100).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="pt-6 border-t border-white/10 flex justify-between items-baseline">
                    <span className="font-bold text-lg">Net Total</span>
                    <span className="text-3xl font-bold text-primary">₹{(order.total / 100).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest font-bold opacity-60">
                  Zero Tax Applied • Digital Export
                </p>
              </CardContent>
            </Card>

            <Button className="w-full h-16 rounded-2xl gap-3 text-lg font-bold shadow-xl shadow-primary/20" asChild>
              <Link href="/dashboard">
                <Download className="h-5 w-5" />
                Access Files Now
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}