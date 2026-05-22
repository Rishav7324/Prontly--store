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
  CreditCard, 
  ShoppingBag, 
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Printer
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
      toast({ title: "Status Updated", description: `Order is now ${newStatus}.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Order not found</h1>
        <Button asChild><Link href="/admin/orders">Back to Orders</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/orders"><ChevronLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-headline">Manage Order</h1>
            <p className="text-muted-foreground font-mono text-xs">ID: {id.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <div className="flex bg-muted p-1 rounded-lg">
            <Button size="sm" variant={order.status === 'paid' ? 'default' : 'ghost'} onClick={() => updateStatus('paid')}>Paid</Button>
            <Button size="sm" variant={order.status === 'pending' ? 'default' : 'ghost'} onClick={() => updateStatus('pending')}>Pending</Button>
            <Button size="sm" variant={order.status === 'refunded' ? 'destructive' : 'ghost'} onClick={() => updateStatus('refunded')}>Refund</Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Customer Details</CardTitle>
                <CardDescription>Verified purchaser information.</CardDescription>
              </div>
              <Badge variant="outline" className="font-mono">{order.userId}</Badge>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Display Name</p>
                    <p className="font-bold">{order.userName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Email Address</p>
                    <p className="font-bold">{order.userEmail}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Placed On</p>
                    <p className="font-bold">{format(new Date(order.createdAt.toDate()), 'PPP p')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">GST Number</p>
                    <p className="font-mono text-primary">{order.gstNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>Product breakdown and quantity.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left">Product</th>
                    <th className="px-6 py-3 text-center">Qty</th>
                    <th className="px-6 py-3 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {order.items?.map((item: any) => (
                    <tr key={item.productId}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <ShoppingBag className="h-4 w-4 text-primary" />
                          <span className="font-medium">{item.productName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">{item.quantity}</td>
                      <td className="px-6 py-4 text-right font-bold">₹{(item.price / 100).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle>Financials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{(order.subtotal / 100).toLocaleString('en-IN')}</span></div>
                {order.discount > 0 && <div className="flex justify-between text-green-500"><span>Discount</span><span>-₹{(order.discount / 100).toLocaleString('en-IN')}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">GST (18%)</span><span>₹{(order.gst / 100).toLocaleString('en-IN')}</span></div>
                <div className="pt-4 mt-4 border-t border-white/10 flex justify-between items-baseline">
                  <span className="font-bold">Grand Total</span>
                  <span className="text-2xl font-bold text-primary">₹{(order.total / 100).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lifecycle Logs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-start relative">
                <div className="flex flex-col items-center gap-1">
                  <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center"><CheckCircle2 className="h-4 w-4 text-green-500" /></div>
                  <div className="w-[2px] flex-1 bg-border" />
                </div>
                <div>
                  <p className="text-xs font-bold">Order Created</p>
                  <p className="text-[10px] text-muted-foreground">{format(new Date(order.createdAt.toDate()), 'MMM dd, HH:mm')}</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex flex-col items-center gap-1">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center ${order.status === 'paid' ? 'bg-green-500/20' : 'bg-muted'}`}>
                    {order.status === 'paid' ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold">Payment Verified</p>
                  <p className="text-[10px] text-muted-foreground">{order.status === 'paid' ? 'Confirmed via Razorpay' : 'Pending payment...'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
