'use client';

import { use, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Download, ExternalLink, Loader2, Printer, ShieldCheck, Package } from 'lucide-react';
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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!order || (user && order.userId !== user.uid)) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold mb-4">Order not found</h1>
          <Button asChild><Link href="/dashboard">Back to Dashboard</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="rounded-full">
              <Link href="/dashboard"><ChevronLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold font-headline">Order Details</h1>
              <p className="text-muted-foreground text-sm uppercase font-mono">#{id.toUpperCase()}</p>
            </div>
          </div>
          <Button variant="outline" className="gap-2 rounded-full" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Print Invoice
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card/50 border-white/5 rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-white/5">
                <CardTitle className="text-lg">Items Purchased</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                  {order.items?.map((item: any) => (
                    <div key={item.productId} className="p-6 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">₹{(item.price / 100).toLocaleString('en-IN')}</p>
                        <Button variant="link" className="p-0 h-auto text-[10px] text-primary uppercase font-bold" asChild>
                          <Link href={`/products/${item.productId}`}>View Product</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-white/5 rounded-3xl">
                <CardHeader><CardTitle className="text-base">Billing Info</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p className="font-bold">{order.userName}</p>
                  <p className="text-muted-foreground">{order.userEmail}</p>
                  {order.gstNumber && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">GST Number</p>
                      <p className="font-mono text-primary">{order.gstNumber}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-card/50 border-white/5 rounded-3xl">
                <CardHeader><CardTitle className="text-base">Payment Status</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                    <span className="font-bold text-green-500 uppercase text-xs tracking-widest">{order.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Transaction processed securely. Digital assets are permanently added to your library.
                  </p>
                </CardContent>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20 rounded-3xl overflow-hidden">
              <CardHeader className="bg-primary/10 border-b border-primary/10">
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{(order.subtotal / 100).toLocaleString('en-IN')}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-500">
                      <span>Discount ({order.couponCode})</span>
                      <span>-₹{(order.discount / 100).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST (18%)</span>
                    <span>₹{(order.gst / 100).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-4 mt-4 border-t border-white/10 flex justify-between items-baseline">
                    <span className="font-bold">Total</span>
                    <span className="text-2xl font-bold text-primary">₹{(order.total / 100).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground text-center italic">
                  Paid on {order.paidAt ? format(new Date(order.paidAt.toDate()), 'PPP') : format(new Date(order.createdAt.toDate()), 'PPP')}
                </p>
              </CardContent>
            </Card>

            <Button className="w-full h-12 rounded-full gap-2" asChild>
              <Link href="/dashboard">
                <Download className="h-4 w-4" />
                Access Library
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
