
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useCart } from '@/hooks/use-cart';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, limit, getDocs, doc, increment, updateDoc } from 'firebase/firestore';
import { ShieldCheck, ShoppingBag, ArrowLeft, Loader2, CheckCircle2, Ticket, X, CreditCard } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { analytics } from '@/lib/analytics';
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
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isApplying, setIsApplying] = useState(false);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'main') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.displayName || prev.name,
        email: user.email || prev.email
      }));
    }
  }, [user]);

  const subtotal = getTotal();
  const discount = appliedCoupon 
    ? (appliedCoupon.type === 'percentage' ? Math.round(subtotal * (appliedCoupon.value / 100)) : appliedCoupon.value * 100)
    : 0;
  const total = Math.max(0, subtotal - discount);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || items.length === 0) return;
    setIsProcessing(true);

    try {
      const orderRes = await createRazorpayOrder(total);
      if (!orderRes.success || !orderRes.order) throw new Error(orderRes.error || 'Failed to initiate payment');

      const razorpayKey = settings?.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKey) throw new Error('Payment gateway not configured.');

      const options = {
        key: razorpayKey,
        amount: orderRes.order.amount,
        currency: orderRes.order.currency,
        name: settings?.siteName || "Prontly Store",
        description: `Purchase for ${items.length} assets`,
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
      toast({ variant: "destructive", title: "Checkout Error", description: error.message });
      setIsProcessing(false);
    }
  };

  const finalizeOrder = async (rzpResponse: any, razorpayOrderId: string) => {
    try {
      const verifyRes = await verifyRazorpayPayment(razorpayOrderId, rzpResponse.razorpay_payment_id, rzpResponse.razorpay_signature);
      if (!verifyRes.success) throw new Error('Payment verification failed.');

      const orderData = {
        userId: user?.uid || 'guest',
        userName: formData.name,
        userEmail: formData.email,
        items: items.map(item => ({ productId: item.id, productName: item.name, price: item.price, quantity: item.quantity })),
        subtotal, discount, total, status: 'paid', paymentId: rzpResponse.razorpay_payment_id, createdAt: serverTimestamp(), paidAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db!, 'orders'), orderData);
      
      // Automatic Transactional Email with PDF Invoice
      await sendOrderConfirmationEmail({ id: docRef.id, ...orderData }, settings);

      if (user) {
        await updateDoc(doc(db!, 'users', user.uid), { totalSpent: increment(total), orderCount: increment(1) });
      }

      setIsSuccess(true);
      clearCart();
      setTimeout(() => router.push('/dashboard'), 2500);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Processing Error", description: error.message });
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <CheckCircle2 className="h-24 w-24 text-primary mx-auto animate-bounce" />
          <h1 className="text-4xl font-bold font-headline">Order Confirmed!</h1>
          <p className="text-muted-foreground">Your assets are ready and an invoice has been sent to your email.</p>
          <Button asChild size="lg" className="w-full rounded-2xl h-14"><Link href="/dashboard">Access My Library</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-8"><h1 className="text-4xl font-bold font-headline">Checkout</h1></div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <form onSubmit={handleCheckout} className="lg:col-span-7 space-y-8">
            <Card className="border-white/5 bg-card/30 rounded-[2rem]">
              <CardHeader><CardTitle>Customer Entity</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-12 bg-background/50 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-12 bg-background/50 rounded-xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Button type="submit" size="lg" className="w-full h-16 text-xl font-bold rounded-2xl shadow-xl gap-3" disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : <CreditCard className="h-6 w-6" />}
              {isProcessing ? 'Synchronizing...' : `Pay ₹${(total / 100).toLocaleString('en-IN')}`}
            </Button>
          </form>
          <div className="lg:col-span-5">
            <Card className="border-white/5 bg-card/50 backdrop-blur-2xl rounded-[2.5rem] p-8">
              <h3 className="font-bold mb-6 flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Order Summary</h3>
              <div className="space-y-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.name} x {item.quantity}</span>
                    <span className="font-bold">₹{(item.price / 100 * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="pt-6 border-t border-white/10 flex justify-between text-2xl font-bold">
                  <span>Total</span>
                  <span className="text-primary">₹{(total / 100).toLocaleString('en-IN')}</span>
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
