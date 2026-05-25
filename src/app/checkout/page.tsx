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
import { ShoppingBag, Loader2, CheckCircle2, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { createRazorpayOrder, verifyRazorpayPayment } from '@/app/actions/razorpay-actions';
import Script from 'next/script';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

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
      toast({ variant: "destructive", title: "Gateway Fault", description: "Initializing payment stack..." });
      return;
    }

    setIsProcessing(true);

    try {
      const orderRes = await createRazorpayOrder(total);
      if (!orderRes.success || !orderRes.order) {
        throw new Error(orderRes.error || 'Failed to initiate secure payment.');
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderRes.order.amount,
        currency: orderRes.order.currency,
        name: settings?.siteName || "Prontly Store",
        description: `Order for ${items.length} assets`,
        order_id: orderRes.order.id,
        handler: async (response: any) => {
          await finalizeOrder(response, orderRes.order!.id);
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

  const finalizeOrder = async (rzpResponse: any, razorpayOrderId: string) => {
    if (!db) return;
    
    try {
      const verifyRes = await verifyRazorpayPayment(
        razorpayOrderId, 
        rzpResponse.razorpay_payment_id, 
        rzpResponse.razorpay_signature
      );

      if (!verifyRes.success) throw new Error('Verification integrity failure.');

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
        status: 'paid', // Optimistic status, webhook will confirm
        paymentId: razorpayOrderId,
        createdAt: serverTimestamp(),
      };

      // Non-blocking Firestore Record creation
      setDoc(orderRef, orderData)
        .then(() => {
          setIsSuccess(true);
          clearCart();
          setTimeout(() => router.push('/dashboard'), 3000);
        })
        .catch(async () => {
          const permissionError = new FirestorePermissionError({
            path: orderRef.path,
            operation: 'create',
            requestResourceData: orderData,
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        });

    } catch (error: any) {
      toast({ variant: "destructive", title: "Fulfillment System Error", description: error.message });
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <CheckCircle2 className="h-24 w-24 text-primary mb-8 animate-bounce" />
        <h1 className="text-4xl font-bold font-headline mb-4">Transaction Verified.</h1>
        <p className="text-muted-foreground mb-8">Accessing your digital vault in moments...</p>
        <Button asChild className="rounded-xl h-14 px-10"><Link href="/dashboard">Go to Library</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" onLoad={() => setScriptLoaded(true)} />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        <h1 className="text-3xl font-bold font-headline mb-12">Secure Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <form onSubmit={handleCheckout} className="lg:col-span-7 space-y-8">
            <div className="p-8 rounded-[2rem] bg-card/30 border border-white/5 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Full Name</Label>
                  <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-12 bg-background/50 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Email Address</Label>
                  <Input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-12 bg-background/50 rounded-xl" />
                </div>
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full h-16 text-lg font-bold rounded-2xl shadow-2xl shadow-primary/20" disabled={isProcessing || items.length === 0}>
              {isProcessing ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <CreditCard className="h-6 w-6 mr-3" />}
              {isProcessing ? 'Verifying Gateway...' : `Authorize Payment • ₹${(total / 100).toLocaleString('en-IN')}`}
            </Button>
          </form>
          <div className="lg:col-span-5">
            <Card className="border-white/5 bg-card/50 rounded-[2.5rem] p-10 sticky top-28">
              <h4 className="text-xl font-bold font-headline mb-8 flex items-center gap-3">
                <ShoppingBag className="h-6 w-6 text-primary" /> 
                Order Recap
              </h4>
              <div className="space-y-6">
                {mounted && items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-sm leading-tight line-clamp-2">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">License: Perpetual</p>
                    </div>
                    <span className="font-bold">₹{(item.price / 100 * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="pt-8 mt-4 border-t border-white/5">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-lg">Total Due</span>
                    <span className="text-3xl font-bold text-primary">{mounted ? `₹${(total / 100).toLocaleString('en-IN')}` : '...'}</span>
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
