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
import { ShoppingBag, Loader2, CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { createRazorpayOrder, verifyRazorpayPayment } from '@/app/actions/razorpay-actions';
import Script from 'next/script';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

/**
 * @fileOverview Secure Checkout Page.
 * Implements a "Webhook-First" fulfillment strategy to ensure reliability.
 */
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
      toast({ variant: "destructive", title: "Gateway Fault", description: "Payment engine initializing..." });
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create Razorpay Order Object
      const orderRes = await createRazorpayOrder(total);
      if (!orderRes.success || !orderRes.order) {
        throw new Error(orderRes.error || 'Failed to initiate secure payment.');
      }

      // 2. Create "Pending" Intent in Firestore (Prevents Race Conditions)
      const orderRef = doc(collection(db, 'orders'));
      const orderData = {
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
        paymentId: orderRes.order.id, // Razorpay Order ID for webhook matching
        createdAt: serverTimestamp(),
      };

      // Non-blocking persistent store of the intent
      setDoc(orderRef, orderData)
        .catch(async () => {
          const permissionError = new FirestorePermissionError({
            path: orderRef.path,
            operation: 'create',
            requestResourceData: orderData,
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        });

      // 3. Configure and Open Gateway UI
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderRes.order.amount,
        currency: orderRes.order.currency,
        name: settings?.siteName || "Prontly Store",
        description: `Digital Assets Purchase (${items.length} items)`,
        order_id: orderRes.order.id,
        handler: async (response: any) => {
          // Signature Verification triggers client-side success 
          // while webhook handles the fulfillment background tasks
          await handleClientVerification(response, orderRes.order!.id);
        },
        prefill: { name: formData.name, email: formData.email },
        theme: { color: "#5b52d6" },
        modal: { ondismiss: () => setIsProcessing(false) }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error: any) {
      toast({ variant: "destructive", title: "Checkout Exception", description: error.message });
      setIsProcessing(false);
    }
  };

  const handleClientVerification = async (rzpResponse: any, razorpayOrderId: string) => {
    try {
      const verifyRes = await verifyRazorpayPayment(
        razorpayOrderId, 
        rzpResponse.razorpay_payment_id, 
        rzpResponse.razorpay_signature
      );

      if (!verifyRes.success) throw new Error('Security integrity check failed.');

      // Immediate UI update for the customer
      setIsSuccess(true);
      clearCart();
      
      // Redirect to dashboard where the webhook-delivered assets will appear
      setTimeout(() => router.push('/dashboard'), 2500);

    } catch (error: any) {
      toast({ variant: "destructive", title: "Fulfillment System Error", description: error.message });
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150" />
          <CheckCircle2 className="h-24 w-24 text-primary relative z-10 animate-in zoom-in duration-500" />
        </div>
        <h1 className="text-4xl font-bold font-headline mb-4 tracking-tight">Transaction Verified.</h1>
        <p className="text-muted-foreground mb-10 text-lg max-w-sm">We are unlocking your digital vault. You will be redirected in moments.</p>
        <Button asChild className="rounded-xl h-14 px-10 font-bold shadow-xl shadow-primary/20"><Link href="/dashboard">Access Library</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setScriptLoaded(true)} />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-7xl">
        <header className="mb-16">
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">
            <ShieldCheck className="h-4 w-4" /> SSL Encrypted Checkout
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-midnight-ink">Secure Checkout.</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <form onSubmit={handleCheckout} className="lg:col-span-7 space-y-10">
            <div className="p-10 rounded-[2.5rem] bg-card/30 border border-white/5 space-y-8 backdrop-blur-md shadow-2xl">
              <h3 className="text-xl font-bold font-headline text-midnight-ink">Customer Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Full Display Name</Label>
                  <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-14 bg-background/50 rounded-2xl border-white/10 px-6 text-lg" placeholder="John Doe" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Electronic Address</Label>
                  <Input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-14 bg-background/50 rounded-2xl border-white/10 px-6 text-lg" placeholder="john@example.com" />
                </div>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full h-20 text-xl font-bold rounded-[2rem] shadow-2xl shadow-primary/30" disabled={isProcessing || items.length === 0}>
              {isProcessing ? <Loader2 className="h-8 w-8 animate-spin mr-4" /> : <CreditCard className="h-8 w-8 mr-4" />}
              {isProcessing ? 'Verifying Gateway...' : `Pay ₹${(total / 100).toLocaleString('en-IN')}`}
            </Button>
            
            <p className="text-center text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] opacity-40">
              Payments processed securely via Razorpay • No data stored locally
            </p>
          </form>

          <div className="lg:col-span-5">
            <Card className="border-white/5 bg-card/50 rounded-[3rem] p-12 sticky top-32 backdrop-blur-xl shadow-2xl overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                <ShoppingBag className="h-32 w-32 text-primary" />
              </div>
              <h4 className="text-2xl font-bold font-headline mb-10 flex items-center gap-4 text-midnight-ink">
                Order Intelligence
              </h4>
              <div className="space-y-8">
                {mounted && items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start gap-6 border-b border-white/5 pb-6">
                    <div className="flex-1 space-y-1">
                      <p className="font-bold text-base leading-tight text-midnight-ink">{item.name}</p>
                      <p className="text-[10px] text-primary uppercase font-black tracking-widest">{item.category}</p>
                    </div>
                    <span className="font-headline font-bold text-lg">₹{(item.price / 100 * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                
                <div className="pt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-muted-foreground text-sm uppercase tracking-widest">Total Due</span>
                    <div className="text-right">
                      <span className="text-5xl font-bold text-primary tracking-tighter">
                        {mounted ? `₹${(total / 100).toLocaleString('en-IN')}` : '...'}
                      </span>
                      <p className="text-[10px] text-muted-foreground uppercase font-black mt-2 tracking-widest opacity-50">Incl. all digital fees</p>
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
