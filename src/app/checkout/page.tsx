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
import { ShieldCheck, ShoppingBag, ArrowLeft, Loader2, CheckCircle2, Ticket, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { analytics } from '@/lib/analytics';
import { sendOrderConfirmationEmail } from '@/app/actions/email-actions';

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
    ? (appliedCoupon.type === 'percentage' 
        ? Math.round(subtotal * (appliedCoupon.value / 100)) 
        : appliedCoupon.value * 100)
    : 0;
    
  const total = Math.max(0, subtotal - discount);

  useEffect(() => {
    if (items.length > 0) {
      analytics.beginCheckout(total, items);
    }
  }, []);

  const handleApplyCoupon = async () => {
    if (!db || !couponCode) return;
    setIsApplying(true);
    try {
      const q = query(collection(db, 'coupons'), where('code', '==', couponCode.toUpperCase()), limit(1));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast({ variant: "destructive", title: "Invalid Coupon", description: "This code does not exist." });
      } else {
        const coupon = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
        if (!coupon.isActive) {
          toast({ variant: "destructive", title: "Expired", description: "This coupon is no longer active." });
        } else if (subtotal < (coupon.minOrderAmount || 0) * 100) {
          toast({ variant: "destructive", title: "Minimum Amount", description: `Minimum order of ₹${coupon.minOrderAmount} required.` });
        } else {
          setAppliedCoupon(coupon);
          toast({ title: "Coupon Applied!", description: `Discount applied.` });
        }
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not validate coupon." });
    } finally {
      setIsApplying(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    if (items.length === 0) return;

    setIsProcessing(true);

    try {
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
        subtotal,
        discount,
        couponCode: appliedCoupon?.code || null,
        total,
        status: 'paid',
        createdAt: serverTimestamp(),
        paidAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Update User Stats for Analytics Reflection
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        updateDoc(userRef, {
          totalSpent: increment(total),
          orderCount: increment(1),
          updatedAt: serverTimestamp()
        }).catch(err => console.error("Stats update failed", err));
      }

      analytics.purchase({ id: docRef.id, ...orderData });
      
      // Trigger Email Confirmation - Sanitize objects for Server Action
      const plainOrder = {
        id: docRef.id,
        userName: formData.name,
        userEmail: formData.email,
        items: orderData.items,
        subtotal: orderData.subtotal,
        discount: orderData.discount,
        total: orderData.total,
      };

      const plainSettings = settings ? {
        emailSettings: settings.emailSettings || null,
        invoiceSettings: settings.invoiceSettings || null
      } : null;

      sendOrderConfirmationEmail(plainOrder, plainSettings);

      setIsSuccess(true);
      clearCart();
      
      toast({ title: "Order Placed Successfully" });

      setTimeout(() => {
        router.push('/dashboard');
      }, 2500);

    } catch (error) {
      toast({ variant: "destructive", title: "Checkout Error", description: "Something went wrong." });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold font-headline">Order Confirmed!</h1>
          <p className="text-muted-foreground text-lg">Your assets have been added to your library. Redirecting you now...</p>
          <Button asChild size="lg" className="w-full h-14 rounded-2xl"><Link href="/dashboard">Access Library</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/products"><ArrowLeft className="mr-2 h-4 w-4" /> Continue Shopping</Link>
          </Button>
          <h1 className="text-4xl font-bold font-headline">Checkout</h1>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <ShoppingBag className="h-16 w-16 text-muted-foreground opacity-20" />
            <h2 className="text-2xl font-bold">Your cart is empty</h2>
            <Button asChild><Link href="/products">Browse Assets</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <form onSubmit={handlePlaceOrder} className="lg:col-span-7 space-y-8">
              <Card className="border-white/5 bg-card/30 rounded-[2rem]">
                <CardHeader><CardTitle>Customer Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="h-12 bg-background/50 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-12 bg-background/50 rounded-xl" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="p-6 bg-primary/5 border border-primary/10 rounded-[2rem]">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold">Secure Digital Delivery</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">By clicking pay, you'll gain instant access to your purchased digital assets. Downloads will be available in your personal dashboard immediately.</p>
                  </div>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full h-16 text-xl font-bold rounded-2xl shadow-xl shadow-primary/20" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : `Complete Purchase • ₹${(total / 100).toLocaleString('en-IN')}`}
              </Button>
            </form>

            <div className="lg:col-span-5">
              <Card className="sticky top-28 overflow-hidden border-white/5 bg-card/50 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl">
                <CardHeader className="bg-muted/30 border-b border-white/5 p-6">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                    Review Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="relative h-16 w-16 rounded-xl overflow-hidden border bg-muted flex-shrink-0">
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold truncate text-sm">{item.name}</h4>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{item.category}</p>
                        </div>
                        <div className="font-bold text-sm">₹{(item.price / 100).toLocaleString('en-IN')}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 space-y-6">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Promo Code" 
                          value={couponCode} 
                          onChange={(e) => setCouponCode(e.target.value)} 
                          className="pl-11 h-12 bg-background border-white/10 rounded-xl" 
                          disabled={!!appliedCoupon} 
                        />
                      </div>
                      {appliedCoupon ? (
                        <Button variant="outline" size="icon" onClick={() => {setAppliedCoupon(null); setCouponCode('');}} className="h-12 w-12 rounded-xl"><X className="h-4 w-4" /></Button>
                      ) : (
                        <Button variant="secondary" className="h-12 px-6 rounded-xl font-bold" onClick={handleApplyCoupon} disabled={isApplying || !couponCode}>{isApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}</Button>
                      )}
                    </div>

                    <div className="space-y-4 pt-6 border-t border-white/5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Item Subtotal</span>
                        <span className="font-medium">₹{(subtotal / 100).toLocaleString('en-IN')}</span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between text-sm text-green-500 font-bold">
                          <span>Discount Applied ({appliedCoupon.code})</span>
                          <span>-₹{(discount / 100).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-3xl font-bold pt-4 border-t border-white/10">
                        <span>Total</span>
                        <span className="text-primary">₹{(total / 100).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 p-6 flex flex-col gap-2">
                  <p className="text-[10px] text-muted-foreground text-center uppercase tracking-[0.2em] font-bold">Secure 256-bit Encryption</p>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
