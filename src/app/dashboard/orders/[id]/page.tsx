'use client';

import { use, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useUser, useAuth } from '@/firebase';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  Download, 
  Loader2, 
  Printer, 
  ShieldCheck, 
  Package,
  Receipt,
  FileDown,
  ExternalLink,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { generateInvoicePdf } from '@/app/actions/email-actions';
import { toast } from '@/hooks/use-toast';

interface OrderItem {
  productName: string;
  price: number;
  quantity: number;
  productId?: string;
}

interface Order {
  id: string;
  status: 'pending' | 'paid' | 'delivered' | 'refunded' | 'failed';
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  createdAt: string;
  paidAt?: string | null;
  items: OrderItem[];
  couponCode?: string;
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, profile } = useUser();
  const auth = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: order, isLoading: loading } = useQuery<Order[]>({
    queryKey: ['user-orders', user?.uid],
    enabled: !!user,
    queryFn: async () => {
      if (!auth?.currentUser) throw new Error('Not authenticated');
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/user/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const currentOrder = order?.find((o) => o.id === id);

  const handleDownloadInvoice = async () => {
    if (!currentOrder) return;
    setIsDownloading(true);
    try {
      const plainOrder = {
        id: currentOrder.id,
        userName: profile?.displayName || user?.displayName || 'Verified Creator',
        userEmail: user?.email || '',
        items: currentOrder.items,
        subtotal: currentOrder.subtotal,
        discount: currentOrder.discountAmount,
        total: currentOrder.totalAmount,
        createdAt: currentOrder.createdAt
      };

      const pdfBase64 = await generateInvoicePdf(plainOrder, null);
      
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${pdfBase64}`;
      link.download = `receipt-${id.slice(-8).toUpperCase()}.pdf`;
      link.click();
      toast({ title: "Receipt Generated", description: "Your purchase record is ready." });
    } catch (e) {
      toast({ variant: "destructive", title: "Generation Error", description: "Could not build the receipt PDF." });
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-5">
             <Receipt className="h-6 w-6 text-muted-foreground opacity-40" />
          </div>
          <h1 className="text-lg md:text-xl font-semibold mb-2">Record Not Found</h1>
          <p className="text-xs text-muted-foreground mb-6 max-w-xs">The transaction with ID {id.slice(-8).toUpperCase()} could not be verified in your library.</p>
          <Button asChild size="sm" className="h-9 rounded-lg px-6"><Link href="/dashboard">Back to Workspace</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 pt-28 pb-20 max-w-6xl">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="rounded-lg h-9 w-9">
              <Link href="/dashboard"><ChevronLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-primary mb-0.5">
                <ShieldCheck className="h-3 w-3" /> Verified Transaction
              </div>
              <h1 className="text-lg md:text-xl font-semibold">Order Overview</h1>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">Ref: {id.toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="h-8 rounded-lg gap-2"
              onClick={handleDownloadInvoice}
              disabled={isDownloading}
            >
              {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
              Export PDF Receipt
            </Button>
            <Button variant="ghost" size="sm" className="h-8 rounded-lg gap-2 hidden sm:flex" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" />
              Print Record
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            {/* Purchase Content */}
            <Card className="rounded-xl shadow-sm p-4 overflow-hidden">
              <CardHeader className="px-0 pt-0 pb-3 border-b border-border/60 flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <CardTitle className="text-sm font-semibold">Assets & Licenses</CardTitle>
                </div>
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-500 border-none px-2 py-0 text-[10px] font-medium rounded-md">
                  {currentOrder.status}
                </Badge>
              </CardHeader>
              <CardContent className="px-0 pb-0 pt-1">
                <div className="divide-y divide-border/60 -mx-4">
                  {currentOrder.items?.map((item, index) => (
                    <div key={item.productId ?? index} className="px-4 py-3.5 flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                          <Receipt className="h-4 w-4 text-muted-foreground opacity-50" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{item.productName}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                             <div className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/5 rounded border border-primary/10">
                                <Zap className="h-2.5 w-2.5 text-primary" />
                                <span className="text-[10px] font-medium text-primary">Perpetual License</span>
                             </div>
                             <span className="text-[10px] text-muted-foreground">Instant Access Enabled</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">₹{(item.price / 100).toLocaleString('en-IN')}</p>
                        {item.productId && (
                          <Link href={`/products/${item.productId}`} className="text-[10px] text-primary hover:underline mt-0.5 inline-flex items-center gap-1">
                            View Product <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="rounded-xl shadow-sm p-4">
                <h3 className="text-[10px] font-medium text-muted-foreground mb-4">Customer Details</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground">Identity</p>
                    <p className="text-sm font-semibold mt-0.5">{profile?.displayName || user?.displayName || 'Verified Creator'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground">Contact Address</p>
                    <p className="text-xs mt-0.5 truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border/60">
                  <div className="flex items-center gap-1.5 text-primary">
                    <ShieldCheck className="h-3 w-3" />
                    <span className="text-[10px] font-medium">Global Order Nexus</span>
                  </div>
                </div>
              </Card>
              
              <Card className="rounded-xl shadow-sm p-4">
                <h3 className="text-[10px] font-medium text-muted-foreground mb-4">Execution Logs</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-green-600 dark:text-green-500">Delivery Synchronized</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        Assets processed on {currentOrder.paidAt ? format(new Date(currentOrder.paidAt), 'PPP p') : 'Recently'}.
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-muted/40 rounded-lg border border-dashed border-border/60">
                     <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Securely stored on Cloudflare Global R2 Edge. Perpetual download access is now active in your digital workspace.
                     </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            <Card className="bg-midnight-ink text-white border-transparent rounded-xl shadow-md overflow-hidden relative">
              <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
                 <Receipt className="h-32 w-32 -translate-y-4 translate-x-4" />
              </div>
              <CardHeader className="bg-white/5 border-b border-white/10 p-4 relative z-10">
                <CardTitle className="text-sm font-semibold text-white/90">Economic Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-6 relative z-10">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/40">Gross Subtotal</span>
                    <span className="font-mono">₹{(currentOrder.subtotal / 100).toLocaleString('en-IN')}</span>
                  </div>
                  {currentOrder.discountAmount > 0 && (
                    <div className="flex justify-between items-center text-xs font-medium text-green-400">
                      <span>Incentive ({currentOrder.couponCode || 'PROMO'})</span>
                      <span className="font-mono">-₹{(currentOrder.discountAmount / 100).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t border-white/10 flex justify-between items-baseline">
                    <span className="text-[10px] font-medium text-white/60">Net Value</span>
                    <span className="text-xl md:text-2xl font-semibold tracking-tight">₹{((currentOrder.totalAmount || 0) / 100).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button className="w-full h-9 bg-white text-midnight-ink hover:bg-white/90 rounded-lg gap-2 font-medium transition-all active:scale-[0.98]" asChild>
                    <Link href="/dashboard/downloads">
                      <Download className="h-3.5 w-3.5" />
                      Open Digital Vault
                    </Link>
                  </Button>
                  <p className="text-[10px] text-center text-white/30 leading-relaxed">
                    Professional Digital License • Perpetual Usage • Instant Global Fulfillment
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm p-4">
               <h3 className="text-[10px] font-medium text-muted-foreground mb-4">Market Compliance</h3>
               <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                     <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                     <span className="text-xs font-medium">PCI-DSS Secure Processor</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                     <Zap className="h-3.5 w-3.5 text-primary" />
                     <span className="text-xs font-medium">Direct Electronic Delivery</span>
                  </div>
                  <div className="pt-3 mt-3 border-t border-border/60">
                     <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                        "Your transaction history is cryptographically logged and synchronized across the Prontly ecosystem."
                     </p>
                  </div>
               </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
