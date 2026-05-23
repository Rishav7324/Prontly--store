'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/hooks/use-cart';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, increment, updateDoc } from 'firebase/firestore';
import { ShoppingBag, Loader2, CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { sendOrderConfirmationEmail } from '@/app/actions/email-actions';
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
    
    setIsProcessing(true);

    try {
      // STEP 1: Create Order on Backend
      const orderRes = await createRazorpayOrder(total);
      if (!orderRes.success || !orderRes.order) {
        throw new Error(orderRes.error || 'Failed to initiate payment');
      }

      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey) throw new Error('Razorpay Public Key is missing.');

      // STEP 2: Launch Razorpay Modal
      const options = {
        key: razorpayKey,
        amount: orderRes.order.amount,
        currency: orderRes.order.currency,
        name: settings?.siteName || "Prontly Store",
        description: `Unlocking ${items.length} Digital Assets`,
        order_id: orderRes.order.id,
        handler: async (response: any) => {
          // Triggered on successful capture in the modal
          await finalizeOrder(response, orderRes.order!.id);
        },
        prefill: {
          name: formData.name,
          email: formData.email,
        },
        theme: {
          color: "#5b52d6",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast({ title: "Payment Cancelled", description: "The checkout process was closed." });
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast({ 
          variant: "destructive", 
          title: "Payment Failed", 
          description: response.error.description || "The transaction could not be completed." 
        });
        setIsProcessing(false);
      });
      rzp.open();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Checkout Error", description: error.message });
      setIsProcessing(false);
    }
  };

  const finalizeOrder = async (rzpResponse: any, razorpayOrderId: string) => {
    try {
      // STEP 3: Cryptographic Signature Verification
      const verifyRes = await verifyRazorpayPayment(
        razorpayOrderId, 
        rzpResponse.razorpay_payment_id, 
        rzpResponse.razorpay_signature
      );

      if (!verifyRes.success) {
        throw new Error(verifyRes.error || 'Security verification failed.');
      }

      // FULFILLMENT: Log order and update stats
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
        total: total,
        status: 'paid',
        paymentId: rzpResponse.razorpay_payment_id,
        createdAt: serverTimestamp(),
        paidAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db!, 'orders'), orderData);
      
      // Send branded confirmation email
      const plainOrder = {
        id: docRef.id,
        userName: orderData.userName,
        userEmail: orderData.userEmail,
        items: JSON.parse(JSON.stringify(orderData.items)),
        total: orderData.total,
        paymentId: orderData.paymentId
      };

      const sanitizedSettings = settings ? JSON.parse(JSON.stringify(settings)) : {};
      await sendOrderConfirmationEmail(plainOrder, sanitizedSettings).catch(console.error);

      if (user) {
        await updateDoc(doc(db!, 'users', user.uid), { 
          totalSpent: increment(total), 
          orderCount: increment(1) 
        });
      }

      setIsSuccess(true);
      clearCart();
      setTimeout(() => router.push('/dashboard'), 3000);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Processing Error", description: error.message });
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <CheckCircle2 className="h-24 w-24 text-primary mx-auto animate-bounce" />
          <div className="space-y-2">
            <h1 className="text-4xl font-bold font-headline">Order Confirmed!</h1>
            <p className="text-muted-foreground text-lg">Your assets have been unlocked. Redirecting to your library...</p>
          </div>
          <Button asChild size="lg" className="w-full rounded-2xl h-14 font-bold shadow-xl">
            <Link href="/dashboard">Access Library Now</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold font-headline">Secure Checkout</h1>
          <p className="text-muted-foreground mt-1">Complete your purchase using our encrypted gateway.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <form onSubmit={handleCheckout} className="lg:col-span-7 space-y-8">
            <Card className="border-white/5 bg-card/30 rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 border-b border-white/5">
                <CardTitle className="text-xl flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Buyer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Full Name</Label>
                    <Input 
                      required 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})} 
                      className="h-14 bg-background/50 border-white/10 rounded-2xl px-6 text-lg" 
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email Address</Label>
                    <Input 
                      required 
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})} 
                      className="h-14 bg-background/50 border-white/10 rounded-2xl px-6 text-lg" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-20 text-2xl font-bold rounded-[2rem] shadow-2xl shadow-primary/20 gap-4 transition-all hover:scale-[1.01] active:scale-[0.99]" 
              disabled={isProcessing || !mounted || items.length === 0}
            >
              {isProcessing ? <Loader2 className="h-8 w-8 animate-spin" /> : <CreditCard className="h-8 w-8" />}
              {isProcessing ? 'Verifying...' : !mounted ? 'Initialising...' : `Pay ₹${(total / 100).toLocaleString('en-IN')}`}
            </Button>
            
            <div className="flex items-center justify-center gap-6 opacity-40 grayscale group-hover:grayscale-0 transition-all">
              <img src="https://cdn.razorpay.com/static/assets/badgetest.png" alt="Razorpay Secure" className="h-8" />
              <div className="h-4 w-[1px] bg-white/20" />
              <p className="text-[10px] font-bold uppercase tracking-widest">PCI DSS Compliant Gateway</p>
            </div>
          </form>

          <div className="lg:col-span-5">
            <Card className="border-white/5 bg-card/50 backdrop-blur-3xl rounded-[3rem] p-10 sticky top-28 shadow-2xl">
              <h3 className="text-2xl font-bold font-headline mb-8 flex items-center gap-3">
                <ShoppingBag className="h-6 w-6 text-primary" /> 
                Order Recap
              </h3>
              
              <div className="space-y-6">
                {mounted ? items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-1">
                      <p className="font-bold text-base leading-tight">{item.name}</p>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Qty: {item.quantity} • {item.category}</p>
                    </div>
                    <span className="font-bold text-lg whitespace-nowrap">₹{(item.price / 100 * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                )) : (
                  <div className="animate-pulse space-y-6">
                    <div className="h-10 bg-white/5 rounded-2xl w-full" />
                    <div className="h-10 bg-white/5 rounded-2xl w-3/4" />
                  </div>
                )}
                
                <div className="pt-8 mt-4 border-t border-white/10 space-y-4">
                  <div className="flex justify-between text-muted-foreground font-medium">
                    <span>Subtotal</span>
                    <span>₹{(total / 100).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-3xl font-bold font-headline pt-2">
                    <span>Total</span>
                    <span className="text-primary">{mounted ? `₹${(total / 100).toLocaleString('en-IN')}` : '...'}</span>
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
