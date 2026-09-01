'use client';

import { use, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Clock,
  Printer
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { adminJsonFetcher, adminFetch } from '@/lib/auth/admin-fetch';

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  // Order is resolved from the admin orders list (each row carries items[])
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => adminJsonFetcher('/api/admin/orders'),
    refetchInterval: 15000,
  });

  const order = useMemo(
    () => (orders as any[]).find((o) => o.id === id) || null,
    [orders, id]
  );

  const updateStatus = async (newStatus: string) => {
    if (!order) return;
    try {
      const res = await adminFetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: newStatus }),
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({ title: "Order State Modified", description: `Transitioned to ${newStatus}.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Transition Error" });
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-9 w-9 animate-spin text-primary" /></div>;
  }

  if (!order) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <h1 className="text-lg font-semibold mb-3">Order not found</h1>
        <Button asChild className="h-9 rounded-lg text-xs"><Link href="/admin/orders">Back to Orders</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-lg shrink-0">
            <Link href="/admin/orders"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-semibold font-mono truncate">#{id.slice(-8)}</h1>
              <Badge variant={order.status === 'paid' ? 'default' : 'secondary'} className="shrink-0 text-[10px] font-medium capitalize">{order.status}</Badge>
            </div>
            <p className="text-[10px] font-medium text-muted-foreground truncate">Order Console · Record Index: {id.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            className="h-9 rounded-lg gap-2 text-xs"
            onClick={async () => {
              try {
                const { generateInvoicePdf } = await import('@/lib/payment/invoice');
                const pdfBase64 = await generateInvoicePdf(order);
                const link = document.createElement('a');
                link.href = `data:application/pdf;base64,${pdfBase64}`;
                link.download = `tax-invoice-${order.id.slice(-8)}.pdf`;
                link.click();
                toast({ title: "Invoice Downloaded", description: `tax-invoice-${order.id.slice(-8)}.pdf` });
              } catch (e) {
                toast({ variant: "destructive", title: "Download Failed" });
              }
            }}
          >
            <Printer className="h-3.5 w-3.5 text-amber-500" /> Download PDF Invoice
          </Button>
          <div className="flex items-center gap-1">
            <Button size="sm" className="h-9 rounded-lg px-3 text-xs" variant={order.status === 'paid' ? 'default' : 'ghost'} onClick={() => updateStatus('paid')}>Paid</Button>
            <Button size="sm" className="h-9 rounded-lg px-3 text-xs" variant={order.status === 'refunded' ? 'destructive' : 'ghost'} onClick={() => updateStatus('refunded')}>Refund</Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-8 space-y-3">
          <Card className="rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Customer</p>
              <Badge variant="outline" className="font-mono text-[10px] font-medium border-primary/20 text-primary">UID: {order.userId?.slice(-8)}</Badge>
            </div>
            <div className="flex items-center justify-between py-1.5 text-xs border-b border-border/60">
              <span className="text-[10px] font-medium text-muted-foreground">Public Name</span>
              <span className="font-medium truncate ml-4 max-w-[60%]" title={order.userName}>{order.userName}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 text-xs border-b border-border/60">
              <span className="text-[10px] font-medium text-muted-foreground">Email</span>
              <span className="font-medium truncate ml-4 max-w-[60%]" title={order.userEmail}>{order.userEmail}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 text-xs border-b border-border/60">
              <span className="text-[10px] font-medium text-muted-foreground">Placed On</span>
              <span className="font-medium">{order.createdAt ? format(new Date(order.createdAt), 'PPP p') : 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 text-xs border-b border-border/60">
              <span className="text-[10px] font-medium text-muted-foreground">Verification</span>
              <Badge className="bg-green-500/10 text-green-500 border-none font-medium text-[10px] capitalize">Verified</Badge>
            </div>
          </Card>

          <Card className="rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 pb-2">
              <p className="text-sm font-semibold">Line Items</p>
              <p className="text-[10px] font-medium text-muted-foreground mt-0.5">{order.items?.length || 0} item(s) in this order.</p>
            </div>
            <CardContent className="p-0 pt-0">
              <div className="-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto">
                <table className="w-full min-w-[640px] text-xs">
                  <thead className="bg-muted/40 border-y border-border">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Product</th>
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground">Qty</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Unit Price</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {order.items?.map((item: any) => (
                      <tr key={item.id || item.productId} className="hover:bg-muted/40 transition-colors">
                        <td className="px-3 py-2 font-medium">{item.productName}</td>
                        <td className="px-3 py-2 text-center text-muted-foreground">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">₹{((item.price || 0) / 100).toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-right font-semibold">₹{(((item.price || 0) * (item.quantity || 1)) / 100).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-3">
          <Card className="rounded-xl shadow-sm border p-4">
            <p className="text-sm font-semibold mb-2">Summary</p>
            <div className="flex justify-between py-1.5 text-xs border-b border-border/60">
              <span className="text-[10px] font-medium text-muted-foreground">Subtotal</span>
              <span className="font-medium">₹{((order.subtotal || 0) / 100).toLocaleString('en-IN')}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between py-1.5 text-xs border-b border-border/60">
                <span className="text-[10px] font-medium text-green-500">Discount</span>
                <span className="font-medium text-green-500">-₹{(order.discountAmount / 100).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-3 pb-1">
              <span className="text-sm font-semibold">Net Value</span>
              <span className="text-xl font-semibold text-primary">₹{((order.totalAmount || order.total || 0) / 100).toLocaleString('en-IN')}</span>
            </div>
            <p className="text-[10px] font-medium text-muted-foreground text-center pt-2">Direct digital fulfillment</p>
          </Card>

          <Card className="rounded-xl shadow-sm border p-4">
            <p className="text-sm font-semibold mb-3">Timeline</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-6 w-6 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium">Transaction Logged</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{order.createdAt ? format(new Date(order.createdAt), 'MMM dd, HH:mm:ss') : 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${order.status === 'paid' ? 'bg-green-500/15' : 'bg-muted'}`}>
                  {order.status === 'paid' ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium">Payment</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{order.status === 'paid' ? 'Authenticated via Razorpay Node' : 'Awaiting confirmation...'}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
