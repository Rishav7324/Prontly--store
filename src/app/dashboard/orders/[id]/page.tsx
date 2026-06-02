'use client';

import { use, useMemo, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
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
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { generateInvoicePdf } from '@/app/actions/email-actions';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useUser();
  const db = useFirestore();
  const [isDownloading, setIsDownloading] = useState(false);

  const orderRef = useMemoFirebase(() => (db ? doc(db, 'orders', id) : null), [db, id]);
  const { data: order, loading } = useDoc(orderRef);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'main') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const handleDownloadInvoice = async () => {
    if (!order) return;
    setIsDownloading(true);
    try {
      const plainOrder = {
        id: order.id,
        userName: order.userName,
        userEmail: order.userEmail,
        items: order.items,
        subtotal: order.subtotal,
        discount: order.discount,
        total: order.total,
        createdAt: order.createdAt
      };

      const plainSettings = settings ? {
        invoiceSettings: settings.invoiceSettings || {}
      } : null;

      const pdfBase64 = await generateInvoicePdf(plainOrder, plainSettings);
      
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
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!order || (user && order.userId !== user.uid)) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
             <Receipt className="h-8 w-8 text-muted-foreground opacity-20" />
          </div>
          <h1 className="text-3xl font-bold font-headline mb-4">Record Not Found</h1>
          <p className="text-muted-foreground mb-8 max-w-xs">The transaction with ID {id.slice(-8).toUpperCase()} could not be verified in your library.</p>
          <Button asChild className="rounded-xl h-12 px-10"><Link href="/dashboard">Back to Workspace</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 pt-32 pb-24 max-w-6xl">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" asChild className="rounded-full bg-muted/40 h-12 w-12 border border-stone-gray/5">
              <Link href="/dashboard"><ChevronLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-1">
                <ShieldCheck className="h-3 w-3" /> Verified Transaction
              </div>
              <h1 className="text-3xl font-bold font-headline text-midnight-ink">Order Overview</h1>
              <p className="text-xs font-mono text-muted-foreground mt-1">Ref: {id.toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="h-12 px-6 rounded-xl gap-2.5 border-stone-gray/10 font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-white"
              onClick={handleDownloadInvoice}
              disabled={isDownloading}
            >
              {isDownloading ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <FileDown className="h-4 w-4" />}
              Export PDF Receipt
            </Button>
            <Button variant="ghost" className="h-12 px-6 rounded-xl gap-2.5 font-bold text-xs uppercase tracking-widest bg-muted/30 hidden sm:flex" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print Record
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8 space-y-10">
            {/* Purchase Content */}
            <Card className="bg-white border-stone-gray/10 rounded-[2.5rem] overflow-hidden shadow-sm">
              <CardHeader className="bg-muted/20 border-b border-stone-gray/5 p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-headline">Assets & Licenses</CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-none px-3 py-1 font-black text-[9px] uppercase tracking-widest">
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-stone-gray/5">
                  {order.items?.map((item: any) => (
                    <div key={item.productId} className="p-8 flex items-center justify-between gap-6 group hover:bg-muted/10 transition-all">
                      <div className="flex items-center gap-6 min-w-0">
                        <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center border border-stone-gray/5 shrink-0 group-hover:scale-105 transition-transform">
                          <Receipt className="h-6 w-6 text-muted-foreground opacity-40" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-base text-midnight-ink truncate">{item.productName}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-1">
                             <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/5 rounded border border-primary/10">
                                <Zap className="h-2.5 w-2.5 text-primary" />
                                <span className="text-[9px] font-black uppercase text-primary tracking-widest">Perpetual License</span>
                             </div>
                             <span className="text-[10px] text-muted-foreground font-medium italic">Instant Access Enabled</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-lg font-headline">₹{(item.price / 100).toLocaleString('en-IN')}</p>
                        <Link href={`/products/${item.productId}`} className="text-[10px] text-primary uppercase font-black tracking-widest hover:underline mt-1.5 flex items-center justify-end gap-1 group-hover:translate-x-1 transition-transform">
                          Inspect Specs <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-white border-stone-gray/10 rounded-[2.5rem] p-8 shadow-sm">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-ghost-gray mb-6">Customer Ledger</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest text-midnight-ink opacity-40">Identity</p>
                    <p className="text-xl font-bold text-midnight-ink mt-1">{order.userName || 'Verified Creator'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest text-midnight-ink opacity-40">Contact Address</p>
                    <p className="text-sm font-medium text-slate-blue mt-1">{order.userEmail}</p>
                  </div>
                </div>
                <div className="mt-8 pt-6 border-t border-stone-gray/5">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3 text-primary" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Global Order Nexus</span>
                  </div>
                </div>
              </Card>
              
              <Card className="bg-white border-stone-gray/10 rounded-[2.5rem] p-8 shadow-sm">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-ghost-gray mb-6">Execution Logs</h4>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20">
                      <ShieldCheck className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-black text-green-600 uppercase text-[10px] tracking-widest">Delivery Synchronized</p>
                      <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed italic">
                        Assets processed on {order.paidAt ? format(order.paidAt.toDate ? order.paidAt.toDate() : new Date(order.paidAt), 'PPP p') : 'Recently'}.
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-xl border border-dashed border-stone-gray/10">
                     <p className="text-[9px] font-medium text-slate-blue leading-relaxed">
                        Securely stored on Cloudflare Global R2 Edge. Perpetual download access is now active in your digital workspace.
                     </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <Card className="bg-midnight-ink text-white rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
                 <Receipt className="h-40 w-48" />
              </div>
              <CardHeader className="bg-white/5 border-b border-white/5 p-8 relative z-10">
                <CardTitle className="text-xl font-headline text-white/90">Economic Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8 relative z-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-white/40">Gross Subtotal</span>
                    <span className="font-mono">₹{(order.subtotal / 100).toLocaleString('en-IN')}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between items-center text-sm font-bold text-green-400">
                      <span>Incentive ({order.couponCode || 'PROMO'})</span>
                      <span className="font-mono">-₹{(order.discountAmount / 100).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="pt-8 border-t border-white/10 flex justify-between items-baseline">
                    <span className="font-black uppercase text-[10px] tracking-[0.25em] text-white/60">Net Value</span>
                    <div className="text-right">
                      <p className="text-4xl font-bold font-headline">₹{((order.totalAmount || order.total) / 100).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button className="w-full h-14 bg-white text-midnight-ink hover:bg-white/90 rounded-2xl gap-3 font-bold text-base transition-all hover:scale-[1.02] shadow-xl shadow-black/20" asChild>
                    <Link href="/dashboard/downloads">
                      <Download className="h-5 w-5" />
                      Open Digital Vault
                    </Link>
                  </Button>
                  <p className="text-[8px] text-center text-white/30 uppercase font-black tracking-widest leading-loose">
                    Professional Digital License • Perpetual Usage • Instant Global Fulfillment
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-stone-gray/10 rounded-[2rem] p-8 shadow-sm">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-ghost-gray mb-6">Market Compliance</h4>
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <ShieldCheck className="h-4 w-4 text-primary" />
                     <span className="text-[11px] font-bold text-midnight-ink">PCI-DSS Secure Processor</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <Zap className="h-4 w-4 text-primary" />
                     <span className="text-[11px] font-bold text-midnight-ink">Direct Electronic Delivery</span>
                  </div>
                  <div className="pt-6 mt-6 border-t border-stone-gray/5">
                     <p className="text-[9px] text-slate-blue leading-relaxed font-medium italic">
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

