
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useCart } from '@/hooks/use-cart';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, ShoppingBag, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';

export default function CheckoutPage() {
  const { items, getTotal, clearCart } = useCart();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    gstNumber: ''
  });

  const subtotal = getTotal();
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;

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
        gst,
        total,
        status: 'paid', // Simulating successful immediate payment for MVP
        createdAt: serverTimestamp(),
        paidAt: serverTimestamp()
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      setIsSuccess(true);
      clearCart();
      
      toast({
        title: "Order Placed Successfully",
        description: "Your digital assets are now available in your library.",
      });

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);

    } catch (error) {
      console.error('Checkout failed:', error);
      toast({
        variant: "destructive",
        title: "Checkout Error",
        description: "Something went wrong while placing your order. Please try again.",
      });
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
          <p className="text-muted-foreground text-lg">
            Thank you for your purchase. We've sent a confirmation email to <strong>{formData.email}</strong>.
          </p>
          <p className="text-sm text-muted-foreground">Redirecting you to your library...</p>
          <Button asChild size="lg" className="w-full">
            <Link href="/dashboard">Access My Library</Link>
          </Button>
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
            <p className="text-muted-foreground">Add some assets to your cart to proceed with checkout.</p>
            <Button asChild><Link href="/products">Browse Assets</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            <form onSubmit={handlePlaceOrder} className="lg:col-span-7 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        required 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        required 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Billing Details (Optional)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="gst">GST Number (for B2B Invoices)</Label>
                    <Input 
                      id="gst" 
                      placeholder="e.g. 07AAAAA0000A1Z5"
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({...formData, gstNumber: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="bg-secondary/30 rounded-xl p-6 border flex gap-4 items-start">
                <ShieldCheck className="h-6 w-6 text-primary flex-shrink-0" />
                <div className="text-sm">
                  <h4 className="font-bold mb-1">Guaranteed Safe Checkout</h4>
                  <p className="text-muted-foreground">Your payment is processed through Razorpay's secure infrastructure. We do not store your credit card details.</p>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full h-14 text-lg font-bold" disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  `Pay ₹${(total / 100).toLocaleString('en-IN')}`
                )}
              </Button>
            </form>

            <div className="lg:col-span-5">
              <Card className="sticky top-28 overflow-hidden">
                <CardHeader className="bg-muted/30">
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="relative h-16 w-16 rounded overflow-hidden border bg-muted">
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

                  <div className="mt-8 space-y-2 border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{(subtotal / 100).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">GST (18%)</span>
                      <span>₹{(gst / 100).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold pt-4 border-t">
                      <span>Total</span>
                      <span className="text-accent">₹{(total / 100).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 p-4 justify-center">
                  <p className="text-[10px] text-muted-foreground text-center">
                    By completing your purchase, you agree to our <Link href="/terms" className="underline">Terms of Service</Link> and <Link href="/refund-policy" className="underline">Refund Policy</Link>.
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
