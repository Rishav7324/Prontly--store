
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
import { ShoppingBag, Loader2, CheckCircle2, CreditCard, ShieldCheck, AlertCircle } from 'lucide-react';
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
      toast({ variant: "destructive", title: "System Readying", description: "Payment gateway is still loading. Please try again in a moment." });
      return;
    }

    setIsProcessing(true);

    try {
      // STEP 1: Create Order on Backend
      const orderRes = await createRazorpayOrder(total);
      if (!orderRes.success || !orderRes.order) {
        throw new Error(orderRes.error || 'Could not initiate payment session.');
      }

      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey) throw new Error('Razorpay configuration is incomplete on the client.');

      // STEP 2: Launch Razorpay Modal
      const options = {
        key: razorpayKey,
        amount: orderRes.order.amount,
        currency: orderRes.order.currency,
        name: settings?.siteName || "Prontly Store",
        description: `Unlocking ${items.length} Digital Assets`,
        order_id: orderRes.order.id,
        handler: async (response: any) => {
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
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast({ 
          variant: "destructive", 
          title: "Transaction Declined", 
          description: response.error.description || "The payment could not be processed by your provider." 
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
        throw new Error(verifyRes.error || 'Payment security check failed.');
      }

      // FULFILLMENT: Log order in Firestore
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
        status: 'paid',
        paymentId: rzpResponse.razorpay_payment_id,
        createdAt: serverTimestamp(),
        paidAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db!, 'orders'), orderData);
      
      const plainOrder = {
        id: docRef.id,
        userName: orderData.userName,
        userEmail: orderData.userEmail,
        items: JSON.parse(JSON.stringify(orderData.items)),
        subtotal: orderData.subtotal,
        discount: orderData.discount,
        total: orderData.total,
        paymentId: orderData.paymentId
      };

      const sanitizedSettings = settings ? JSON.parse(JSON.stringify(settings)) : {};
      
      // Dispatch email (Async)
      sendOrderConfirmationEmail(plainOrder, sanitizedSettings).catch(console.error);

      // Update user stats
      if (user) {
        updateDoc(doc(db!, 'users', user.uid), { 
          totalSpent: increment(total), 
          orderCount: increment(1) 
        }).catch(console.error);
      }

      setIsSuccess(true);
      clearCart();
      setTimeout(() => router.push('/dashboard'), 3000);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Fulfillment Error", description: error.message });
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
          <CheckCircle2 className="h-24 w-24 text-primary mx-auto animate-bounce" />
          <div className="space-y-2">
            <h1 className="text-4xl font-bold font-headline">Success!</h1>
            <p className="text-muted-foreground text-lg">Your purchase is verified. Redirecting to your digital library...</p>
          </div>
          <Button asChild size="lg" className="w-full rounded-2xl h-14 font-bold shadow-xl">
            <Link href="/dashboard">Access Library</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Script 
        src="https://checkout.razorpay.com/v1/checkout.js" 
        onLoad={() => setScriptLoaded(true)}
      />
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold font-headline">Checkout</h1>
          <p className="text-muted-foreground mt-1">Provide your billing details to unlock your assets.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <form onSubmit={handleCheckout} className="lg:col-span-7 space-y-8">
            <Card className="border-white/5 bg-card/30 rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 border-b border-white/5">
                <CardTitle className="text-xl flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Buyer Identity
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
              className="w-full h-20 text-2xl font-bold rounded-[2rem] shadow-2xl shadow-primary/20 gap-4 transition-all hover:scale-[1.01]" 
              disabled={isProcessing || !mounted || items.length === 0}
            >
              {isProcessing ? <Loader2 className="h-8 w-8 animate-spin" /> : <CreditCard className="h-8 w-8" />}
              {isProcessing ? 'Validating...' : !mounted ? 'Calculating...' : `Pay ₹${(total / 100).toLocaleString('en-IN')}`}
            </Button>
            
            <div className="flex items-center justify-center gap-6 opacity-30">
              <img src="https://cdn.razorpay.com/static/assets/badgetest.png" alt="Secure" className="h-8" />
              <div className="h-4 w-[1px] bg-white/20" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Encrypted Gateway</p>
            </div>
          </form>

          <div className="lg:col-span-5">
            <Card className="border-white/5 bg-card/50 backdrop-blur-3xl rounded-[3rem] p-10 sticky top-28">
              <h3 className="text-2xl font-bold font-headline mb-8 flex items-center gap-3">
                <ShoppingBag className="h-6 w-6 text-primary" /> 
                Order Summary
              </h3>
              
              <div className="space-y-6">
                {mounted ? items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <p className="font-bold text-base leading-tight">{item.name}</p>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-bold text-lg">₹{(item.price / 100 * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                )) : (
                  <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-white/5 rounded-xl w-full" />
                    <div className="h-8 bg-white/5 rounded-xl w-2/3" />
                  </div>
                )}
                
                <div className="pt-8 mt-4 border-t border-white/10">
                  <div className="flex justify-between text-3xl font-bold font-headline">
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
