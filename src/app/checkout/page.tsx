'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/hooks/use-cart';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { ShoppingBag, Loader2, CheckCircle2, CreditCard, ShieldCheck, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { createRazorpayOrder, verifyRazorpayPayment } from '@/app/actions/razorpay-actions';
import Script from 'next/script';

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCart();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'main') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
  });

  useEffect(() => {
    setMounted(true);
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.displayName || prev.name,
        email: user.email || prev.email
      }));
    }
  }, [user]);

  const total = getTotal();

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || items.length === 0) return;
    
    if (!scriptLoaded || !(window as any).Razorpay) {
      toast({ variant: "destructive", title: "Gateway Error", description: "Payment system still initializing..." });
      return;
    }

    setIsProcessing(true);

    try {
      const orderRes = await createRazorpayOrder(total);
      if (!orderRes.success || !orderRes.order) {
        throw new Error(orderRes.error || 'Failed to initiate secure payment.');
      }

      const orderRef = doc(collection(db, 'orders'));
      await setDoc(orderRef, {
        userId: user?.uid || 'guest',
        userName: formData.name,
        userEmail: formData.email,
        items: items.map(item => ({ 
          productId: item.id, 
          productName: item.name, 
          price: item.price, 
          quantity: item.quantity 
        })),
        subtotal: total,
        discount: 0,
        total: total,
        status: 'pending',
        paymentId: orderRes.order.id, 
        createdAt: serverTimestamp(),
      });

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderRes.order.amount,
        currency: orderRes.order.currency,
        name: settings?.siteName || "Prontly Store",
        description: `Purchase of ${items.length} Digital Asset(s)`,
        order_id: orderRes.order.id,
        handler: async (response: any) => {
          await handlePaymentCompletion(response, orderRes.order!.id);
        },
        prefill: { name: formData.name, email: formData.email },
        theme: { color: "#5b52d6" },
        modal: { ondismiss: () => setIsProcessing(false) }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error: any) {
      toast({ variant: "destructive", title: "Checkout Fault", description: error.message });
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

      if (!verifyRes.success) throw new Error('Transaction security verification failed.');

      setIsSuccess(true);
      clearCart();
      
      setTimeout(() => router.push('/dashboard'), 2000);

    } catch (error: any) {
      toast({ variant: "destructive", title: "Fulfillment Fault", description: error.message });
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
          <CheckCircle2 className="h-20 w-20 text-primary relative z-10 animate-in zoom-in duration-500" />
        </div>
        <h1 className="text-3xl font-bold font-headline mb-3 tracking-tight text-midnight-ink">Purchase Verified.</h1>
        <p className="text-muted-foreground mb-8 text-base max-w-xs">We are currently delivering your digital assets to your library vault.</p>
        <Button asChild size="lg" className="rounded-xl h-12 px-10 font-bold shadow-xl shadow-primary/20">
          <Link href="/dashboard">Enter Library</Link>
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
            <h1 className="text-4xl font-bold font-headline tracking-tight text-midnight-ink">Complete Order.</h1>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <form onSubmit={handleCheckout} className="lg:col-span-7 space-y-8">
            <Card className="rounded-3xl border-stone-gray/10 bg-white shadow-sm overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <h3 className="text-xl font-bold font-headline text-midnight-ink border-b border-stone-gray/10 pb-4">Identity Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-ghost-gray ml-1">Customer Name</Label>
                    <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-12 bg-background/50 rounded-xl border-stone-gray/10 px-4 text-base" placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-ghost-gray ml-1">Digital Address</Label>
                    <Input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-12 bg-background/50 rounded-xl border-stone-gray/10 px-4 text-base" placeholder="john@domain.com" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" size="lg" className="w-full h-16 text-xl font-bold rounded-2xl shadow-xl shadow-primary/20" disabled={isProcessing || items.length === 0}>
              {isProcessing ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <CreditCard className="h-6 w-6 mr-3" />}
              {isProcessing ? 'Verifying Transaction...' : `Pay ₹${(total / 100).toLocaleString('en-IN')}`}
            </Button>
            
            <p className="text-[10px] text-center text-ghost-gray uppercase font-black tracking-[0.2em] opacity-60">
              Atomic Fulfillment Protocol Active • Cloudflare Secure Edge
            </p>
          </form>

          <div className="lg:col-span-5">
            <Card className="border-stone-gray/10 bg-white rounded-[2rem] p-8 sticky top-28 shadow-xl overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
                <ShoppingBag className="h-40 w-40 text-primary" />
              </div>
              <h4 className="text-2xl font-bold font-headline mb-8 text-midnight-ink relative z-10">Order Summary</h4>
              <div className="space-y-6 relative z-10">
                {mounted && items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start gap-4 border-b border-stone-gray/10 pb-6">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base leading-tight text-midnight-ink truncate">{item.name}</p>
                      <p className="text-[9px] text-primary uppercase font-black tracking-widest mt-1">{item.category}</p>
                    </div>
                    <span className="font-headline font-bold text-lg whitespace-nowrap">₹{(item.price / 100 * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                
                <div className="pt-2">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-ghost-gray text-[10px] uppercase tracking-widest">Grand Total</span>
                    <div className="text-right">
                      <span className="text-5xl font-bold text-primary tracking-tighter">
                        {mounted ? `₹${(total / 100).toLocaleString('en-IN')}` : '...'}
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
