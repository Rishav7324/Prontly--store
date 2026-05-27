'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/use-cart';
import { useUser } from '@/firebase';
import { ShoppingBag, Loader2, CreditCard, ShieldCheck, ChevronLeft, Lock, Zap } from 'lucide-react';
import Link from 'next/link';
import { useCheckout } from '@/hooks/use-checkout';
import { formatPrice, calculatePriceBreakdown } from '@/lib/payment/gst';
import Script from 'next/script';

export default function CheckoutPage() {
  const { items, getTotal } = useCart();
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const { startCheckout, isProcessing } = useCheckout();
  
  const [couponCode, setCouponCode] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push('/login?redirect=/checkout');
    }
  }, [user, authLoading, mounted, router]);

  const rawSubtotal = getTotal();
  const breakdown = calculatePriceBreakdown({ subtotal: rawSubtotal, discountAmount: 0 });

  if (authLoading || !mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        <header className="mb-12 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-muted/50 h-10 w-10">
            <Link href="/cart"><ChevronLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Secure Checkout Terminal
            </div>
            <h1 className="text-4xl font-bold font-headline tracking-tight text-midnight-ink">Finalize Order.</h1>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-8">
            <Card className="rounded-3xl border-stone-gray/10 bg-white shadow-sm overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-stone-gray/10 pb-4">
                  <h3 className="text-xl font-bold font-headline text-midnight-ink">Customer Identity</h3>
                  <Badge variant="outline" className="text-[10px] uppercase border-primary/20 text-primary">Verified Account</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-ghost-gray ml-1">Full Name</Label>
                    <div className="h-12 bg-muted/30 rounded-xl flex items-center px-4 text-sm font-medium border border-transparent">
                      {user?.displayName || 'Creator'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black tracking-widest text-ghost-gray ml-1">Email Address</Label>
                    <div className="h-12 bg-muted/30 rounded-xl flex items-center px-4 text-sm font-medium border border-transparent">
                      {user?.email}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-stone-gray/10 bg-white shadow-sm overflow-hidden">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-3 text-primary">
                  <Zap className="h-5 w-5" />
                  <h3 className="text-xl font-bold font-headline text-midnight-ink">Promotional Codes</h3>
                </div>
                <div className="flex gap-4">
                  <Input 
                    placeholder="Enter coupon..." 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="h-12 bg-background/50 rounded-xl border-stone-gray/10"
                  />
                  <Button variant="outline" className="h-12 px-8 rounded-xl font-bold">Apply</Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Button 
                onClick={() => startCheckout(couponCode)}
                size="lg" 
                className="w-full h-16 text-xl font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all" 
                disabled={isProcessing || items.length === 0}
              >
                {isProcessing ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <CreditCard className="h-6 w-6 mr-3" />}
                {isProcessing ? 'Synchronizing...' : `Authorize ${formatPrice(breakdown.total)}`}
              </Button>
              <p className="text-[10px] text-center text-ghost-gray uppercase font-black tracking-[0.2em]">
                Instant Fulfillment • SSL Encrypted • Direct Delivery
              </p>
            </div>
          </div>

          <div className="lg:col-span-5">
            <Card className="border-stone-gray/10 bg-white rounded-[2.5rem] p-8 sticky top-28 shadow-xl overflow-hidden">
              <h4 className="text-2xl font-bold font-headline mb-8 text-midnight-ink">Economic Recap</h4>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start gap-4 pb-4 border-b border-stone-gray/5">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-midnight-ink truncate">{item.name}</p>
                      <p className="text-[10px] text-ghost-gray uppercase font-bold tracking-widest">{item.category} (x{item.quantity})</p>
                    </div>
                    <span className="font-bold text-sm">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                
                <div className="pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatPrice(breakdown.subtotal)}</span>
                  </div>
                  <div className="pt-4 border-t border-stone-gray/10 flex justify-between items-baseline">
                    <span className="font-bold text-midnight-ink uppercase text-xs tracking-widest">Net Value</span>
                    <div className="text-right">
                      <span className="text-4xl font-bold text-primary tracking-tighter">
                        {formatPrice(breakdown.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-blue leading-relaxed font-medium">
                  By completing this purchase, you authorize direct electronic fulfillment. Perpetual digital license will be issued instantly to your digital library.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
