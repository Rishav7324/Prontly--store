'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/use-cart';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ShoppingBag, Loader2, CheckCircle2, CreditCard, ShieldCheck, ChevronLeft, Lock } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { createRazorpayOrder, verifyRazorpayPayment } from '@/app/actions/razorpay-actions';
import { formatCurrency, calculatePriceBreakdown } from '@/lib/payment/gst';
import Script from 'next/script';

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCart();
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'main') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    setMounted(true);
    if (user) {
      setFormData({
        name: user.displayName || '',
        email: user.email || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      toast({ title: "Authentication Required", description: "Please sign in to finalize your purchase." });
      router.push('/login?redirect=/checkout');
    }
  }, [user, authLoading, mounted, router]);

  const rawSubtotal = getTotal();
  const breakdown = calculatePriceBreakdown(rawSubtotal);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || items.length === 0 || !user) return;
    
    if (!scriptLoaded || !(window as any).Razorpay) {
      toast({ variant: "destructive", title: "Gateway Error", description: "Payment terminal is not ready. Refresh and try again." });
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Generate Order with GST breakdown
      const orderRes = await createRazorpayOrder(rawSubtotal);
      if (!orderRes.success || !orderRes.order) {
        throw new Error(orderRes.error || 'Failed to initialize payment gateway.');
      }

      // 2. Log Pending Intent
      const orderRef = doc(collection(db, 'orders'));
      await setDoc(orderRef, {
        userId: user.uid,
        userName: formData.name,
        userEmail: formData.email,
        items: items.map(item => ({ 
          productId: item.id, 
          productName: item.name, 
          price: item.price, 
          quantity: item.quantity 
        })),
        subtotal: breakdown.subtotal,
        discount: breakdown.discount,
        gst: breakdown.gst,
        total: breakdown.total,
        status: 'pending',
        paymentId: orderRes.order.id,
        createdAt: serverTimestamp(),
      });

      // 3. Launch Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderRes.order.amount,
        currency: orderRes.order.currency,
        name: settings?.siteName || "Prontly Store",
        description: `Purchase of ${items.length} digital asset(s)`,
        order_id: orderRes.order.id,
        handler: async (response: any) => {
          await handlePaymentCompletion(response, orderRes.order!.id);
        },
        prefill: { 
          name: formData.name, 
          email: formData.email 
        },
        theme: { color: "#5b52d6" },
        modal: { 
          ondismiss: () => setIsProcessing(false),
          confirm_close: true
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error: any) {
      toast({ variant: "destructive", title: "Checkout Error", description: error.message });
      setIsProcessing(false);
    }
  };

  const handlePaymentCompletion = async (rzpResponse: any, razorpayOrderId: string) => {
    try {
      const verifyRes = await verifyRazorpayPayment(
        razorpayOrderId, 
        rzpResponse.razorpay_payment_id, 
        rzpResponse.razorpay_signature
      );

      if (!verifyRes.success) throw new Error('Security verification failed.');

      setIsSuccess(true);
      clearCart();
      
      setTimeout(() => {
        router.push('/dashboard/downloads');
        toast({ title: "Purchase Complete", description: "Assets are ready in your library." });
      }, 2000);

    } catch (error: any) {
      toast({ variant: "destructive", title: "Verification Failed", description: error.message });
      setIsProcessing(false);
    }
  };

  if (authLoading || !mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <CheckCircle2 className="h-24 w-24 text-primary mb-6" />
        <h1 className="text-4xl font-bold font-headline mb-4 text-midnight-ink">Payment Successful.</h1>
        <p className="text-muted-foreground mb-8 text-lg max-w-sm">Generating your digital licenses. You will be redirected to your secure library in a moment.</p>
        <Button asChild size="lg" className="rounded-xl h-14 font-bold shadow-xl shadow-primary/20">
          <Link href="/dashboard/downloads">Access My Library</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setScriptLoaded(true)} />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        <header className="mb-12 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-muted/50 h-10 w-10">
            <Link href="/cart"><ChevronLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Secure Checkout
            </div>
            <h1 className="text-4xl font-bold font-headline tracking-tight text-midnight-ink">Payment Terminal.</h1>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <form onSubmit={handleCheckout} className="lg:col-span-7 space-y-8">
            <Card className="rounded-3xl border-stone-gray/10 bg-white shadow-sm overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-stone-gray/10 pb-4">
                  <h3 className="text-xl font-bold font-headline text-midnight-ink">Billing Information</h3>
                  <Badge variant="outline" className="text-[10px] uppercase border-primary/20 text-primary">Verified Account</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-ghost-gray ml-1">Full Name</Label>
                    <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-12 bg-background/50 rounded-xl border-stone-gray/10 px-4" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-ghost-gray ml-1">Email Address</Label>
                    <Input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-12 bg-background/50 rounded-xl border-stone-gray/10 px-4" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Button type="submit" size="lg" className="w-full h-16 text-xl font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all" disabled={isProcessing || items.length === 0}>
                {isProcessing ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <CreditCard className="h-6 w-6 mr-3" />}
                {isProcessing ? 'Processing...' : `Authorize ${formatCurrency(breakdown.total)}`}
              </Button>
              <p className="text-[10px] text-center text-ghost-gray uppercase font-black tracking-[0.2em]">
                Instant Fulfillment • Secure Razorpay Terminal
              </p>
            </div>
          </form>

          <div className="lg:col-span-5">
            <Card className="border-stone-gray/10 bg-white rounded-[2.5rem] p-8 sticky top-28 shadow-xl overflow-hidden">
              <h4 className="text-2xl font-bold font-headline mb-8 text-midnight-ink">Order Summary</h4>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start gap-4 pb-4 border-b border-stone-gray/5">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-midnight-ink truncate">{item.name}</p>
                      <p className="text-[10px] text-ghost-gray uppercase font-bold tracking-widest">{item.category}</p>
                    </div>
                    <span className="font-bold text-sm">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
                
                <div className="pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatCurrency(breakdown.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST (18%)</span>
                    <span className="font-medium">{formatCurrency(breakdown.gst)}</span>
                  </div>
                  <div className="pt-4 border-t border-stone-gray/10 flex justify-between items-baseline">
                    <span className="font-bold text-midnight-ink uppercase text-xs tracking-widest">Total Amount</span>
                    <div className="text-right">
                      <span className="text-4xl font-bold text-primary tracking-tighter">
                        {formatCurrency(breakdown.total)}
                      </span>
                    </div>
                  </div>
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
