
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
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, limit, getDocs } from 'firebase/firestore';
import { ShieldCheck, ShoppingBag, ArrowLeft, Loader2, CheckCircle2, Ticket, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { analytics } from '@/lib/analytics';

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

  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    gstNumber: ''
  });

  const subtotal = getTotal();
  
  const discount = appliedCoupon 
    ? (appliedCoupon.type === 'percentage' 
        ? Math.round(subtotal * (appliedCoupon.value / 100)) 
        : appliedCoupon.value * 100)
    : 0;
    
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const gst = Math.round(discountedSubtotal * 0.18);
  const total = discountedSubtotal + gst;

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
        gstNumber: formData.gstNumber,
        items: items.map(item => ({
          productId: item.id,
          productName: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        subtotal,
        discount,
        couponCode: appliedCoupon?.code || null,
        gst,
        total,
        status: 'paid',
        createdAt: serverTimestamp(),
        paidAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      analytics.purchase({ id: docRef.id, ...orderData });
      
      setIsSuccess(true);
      clearCart();
      
      toast({ title: "Order Placed Successfully", description: "Welcome to the Prontly community." });

      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);

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
            <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
          </div>
          <h1 className="text-4xl font-bold font-headline">Payment Successful!</h1>
          <p className="text-muted-foreground text-lg">Thank you for your purchase.</p>
          <Button asChild size="lg" className="w-full"><Link href="/dashboard">Access My Library</Link></Button>
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
            <Link href="/products"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Store</Link>
          </Button>
          <h1 className="text-4xl font-bold font-headline">Secure Checkout</h1>
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
              <Card className="border-white/5 bg-card/30">
                <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/5 bg-card/30">
                <CardHeader><CardTitle>Tax Details (Optional)</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="gst">GST Number</Label>
                    <Input id="gst" placeholder="07AAAAA0000A1Z5" value={formData.gstNumber} onChange={(e) => setFormData({...formData, gstNumber: e.target.value})} />
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" size="lg" className="w-full h-14 text-lg font-bold" disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : `Pay ₹${(total / 100).toLocaleString('en-IN')}`}
              </Button>
            </form>

            <div className="lg:col-span-5">
              <Card className="sticky top-28 overflow-hidden border-white/5 bg-card/50 backdrop-blur-xl">
                <CardHeader className="bg-muted/30"><CardTitle>Order Summary</CardTitle></CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="relative h-16 w-16 rounded-xl overflow-hidden border bg-muted flex-shrink-0">
                          <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold truncate text-sm">{item.name}</h4>
                          <p className="text-xs text-muted-foreground">{item.quantity} × ₹{(item.price / 100).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="font-bold text-sm">₹{(item.price * item.quantity / 100).toLocaleString('en-IN')}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Coupon Code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="pl-9" disabled={!!appliedCoupon} />
                      </div>
                      {appliedCoupon ? (
                        <Button variant="ghost" size="icon" onClick={() => {setAppliedCoupon(null); setCouponCode('');}}><X className="h-4 w-4" /></Button>
                      ) : (
                        <Button size="sm" onClick={handleApplyCoupon} disabled={isApplying || !couponCode}>{isApplying ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}</Button>
                      )}
                    </div>

                    <div className="space-y-2 border-t pt-4">
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>₹{(subtotal / 100).toLocaleString('en-IN')}</span></div>
                      {appliedCoupon && <div className="flex justify-between text-sm text-green-500"><span>Discount</span><span>-₹{(discount / 100).toLocaleString('en-IN')}</span></div>}
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">GST (18%)</span><span>₹{(gst / 100).toLocaleString('en-IN')}</span></div>
                      <div className="flex justify-between text-2xl font-bold pt-4 border-t"><span>Total</span><span className="text-accent">₹{(total / 100).toLocaleString('en-IN')}</span></div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 p-4 justify-center">
                  <p className="text-[10px] text-muted-foreground text-center">
                    By completing purchase, you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy</Link>.
                  </p>
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
