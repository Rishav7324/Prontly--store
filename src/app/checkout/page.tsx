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
      // 1. Initiate Razorpay Order on Server
      const orderRes = await createRazorpayOrder(total);
      if (!orderRes.success || !orderRes.order) {
        throw new Error(orderRes.error || 'Failed to initiate secure payment.');
      }

      // 2. Create Persistent "Pending" Record in Firestore
      // This allows the webhook to identify the order if the client closes the window
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

      // 3. Launch Secure Payment Terminal
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
      // Step A: Immediate Signature Verification via Server Action
      const verifyRes = await verifyRazorpayPayment(
        razorpayOrderId, 
        rzpResponse.razorpay_payment_id, 
        rzpResponse.razorpay_signature
      );

      if (!verifyRes.success) throw new Error('Transaction security verification failed.');

      // Step B: Optimistic UI Success
      setIsSuccess(true);
      clearCart();
      
      // Step C: Automated Redirect to Dashboard
      // The Webhook fulfills the data in the background, so by the time the user
      // lands on the dashboard, their assets are usually ready.
      setTimeout(() => router.push('/dashboard'), 2000);

    } catch (error: any) {
      toast({ variant: "destructive", title: "Fulfillment Fault", description: error.message });
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
          <CheckCircle2 className="h-32 w-32 text-primary relative z-10 animate-in zoom-in duration-500" />
        </div>
        <h1 className="text-5xl font-bold font-headline mb-4 tracking-tighter">Purchase Verified.</h1>
        <p className="text-muted-foreground mb-12 text-xl max-w-md">We are currently delivering your digital assets to your library vault.</p>
        <Button asChild size="lg" className="rounded-2xl h-16 px-12 font-bold shadow-2xl shadow-primary/20 text-lg">
          <Link href="/dashboard">Enter Library</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setScriptLoaded(true)} />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-20 max-w-7xl">
        <header className="mb-20">
          <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">
            <ShieldCheck className="h-4 w-4" /> Secure Protocol v2
          </div>
          <h1 className="text-5xl md:text-7xl font-bold font-headline tracking-tighter text-midnight-ink">Complete Order.</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          <form onSubmit={handleCheckout} className="lg:col-span-7 space-y-12">
            <div className="p-12 rounded-[3rem] bg-card/30 border border-white/5 space-y-10 backdrop-blur-md shadow-2xl">
              <h3 className="text-2xl font-bold font-headline text-midnight-ink">Identify Customer</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Full Legal Name</Label>
                  <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-16 bg-background/50 rounded-2xl border-white/10 px-8 text-lg" placeholder="John Doe" />
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Digital Address</Label>
                  <Input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-16 bg-background/50 rounded-2xl border-white/10 px-8 text-lg" placeholder="john@domain.com" />
                </div>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full h-24 text-2xl font-bold rounded-[2.5rem] shadow-2xl shadow-primary/30" disabled={isProcessing || items.length === 0}>
              {isProcessing ? <Loader2 className="h-10 w-10 animate-spin mr-6" /> : <CreditCard className="h-10 w-10 mr-6" />}
              {isProcessing ? 'Verifying...' : `Deploy ₹${(total / 100).toLocaleString('en-IN')}`}
            </Button>
            
            <div className="text-center space-y-2 opacity-40">
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">
                Secured by Razorpay Encryption • Atomic Fulfillment Active
              </p>
            </div>
          </form>

          <div className="lg:col-span-5">
            <Card className="border-white/5 bg-card/50 rounded-[4rem] p-16 sticky top-32 backdrop-blur-xl shadow-2xl overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                <ShoppingBag className="h-64 w-64 text-primary" />
              </div>
              <h4 className="text-3xl font-bold font-headline mb-12 text-midnight-ink">
                Summary
              </h4>
              <div className="space-y-10">
                {mounted && items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start gap-8 border-b border-white/5 pb-10">
                    <div className="flex-1 space-y-2">
                      <p className="font-bold text-xl leading-tight text-midnight-ink">{item.name}</p>
                      <p className="text-[10px] text-primary uppercase font-black tracking-widest">{item.category}</p>
                    </div>
                    <span className="font-headline font-bold text-2xl">₹{(item.price / 100 * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                
                <div className="pt-6">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-muted-foreground text-sm uppercase tracking-widest">Net Value</span>
                    <div className="text-right">
                      <span className="text-7xl font-bold text-primary tracking-tighter">
                        {mounted ? `₹${(total / 100).toLocaleString('en-IN')}` : '...'}
                      </span>
                      <p className="text-[10px] text-muted-foreground uppercase font-black mt-4 tracking-widest opacity-50">GST Included where applicable</p>
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
