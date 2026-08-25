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
import { Loader2, CreditCard, ShieldCheck, ChevronLeft, Zap, CheckCircle2, X } from 'lucide-react';
import Link from 'next/link';
import { useCheckout } from '@/hooks/use-checkout';
import { toast } from '@/hooks/use-toast';
import { formatPrice, calculatePriceBreakdown } from '@/lib/payment/gst';
import Script from 'next/script';

interface AppliedCoupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
}

export default function CheckoutPage() {
  const { items, getTotal } = useCart();
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const { startCheckout, isProcessing } = useCheckout();

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [isValidating, setIsValidating] = useState(false);
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

  // Client-side discount calc — mirrors /api/razorpay/create-order logic
  const discountAmount = appliedCoupon
    ? appliedCoupon.discountType === 'percentage'
      ? Math.round((rawSubtotal * appliedCoupon.value) / 100)
      : appliedCoupon.value
    : 0;
  const breakdown = calculatePriceBreakdown({ subtotal: rawSubtotal, discountAmount: Math.min(discountAmount, rawSubtotal) });

  const handleApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) {
      toast({ variant: "destructive", title: "Enter a coupon code" });
      return;
    }
    setIsValidating(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: rawSubtotal }),
      });
      const data = await res.json();
      if (data.success && data.valid) {
        setAppliedCoupon({ code, discountType: data.discountType, value: data.value });
        setCouponInput('');
        toast({ title: "Coupon Applied", description: data.message });
      } else {
        toast({ variant: "destructive", title: "Invalid Coupon", description: data.message || 'Please check the code and try again.' });
      }
    } catch {
      toast({ variant: "destructive", title: "Validation Failed", description: 'Could not verify this coupon. Please try again.' });
    } finally {
      setIsValidating(false);
    }
  };

  if (authLoading || !mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <Navbar />
      <main className="container mx-auto max-w-5xl flex-1 px-4 pb-12 pt-32">
        <header className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-full bg-muted/50">
            <Link href="/cart"><ChevronLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Secure Checkout
            </div>
            <h1 className="mt-0.5 text-xl font-bold font-headline tracking-tight text-midnight-ink">Finalize Order</h1>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <Card className="rounded-xl border-stone-gray/10 bg-white shadow-sm overflow-hidden">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between border-b border-stone-gray/10 pb-3">
                  <h3 className="text-sm font-semibold font-headline text-midnight-ink">Account Details</h3>
                  <Badge variant="outline" className="border-primary/20 px-2 py-0.5 text-[10px] text-primary">Verified</Badge>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Full Name</Label>
                    <div className="flex h-10 items-center rounded-lg border border-transparent bg-muted/30 px-3 text-xs font-medium">
                      {user?.displayName || 'Creator'}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Email Address</Label>
                    <div className="flex h-10 items-center rounded-lg border border-transparent bg-muted/30 px-3 text-xs font-medium">
                      {user?.email}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-stone-gray/10 bg-white shadow-sm overflow-hidden">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center gap-2 text-primary">
                  <Zap className="h-4 w-4" />
                  <h3 className="text-sm font-semibold font-headline text-midnight-ink">Promo Code</h3>
                </div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-green-700">{appliedCoupon.code}</p>
                        <p className="text-[10px] text-green-600/80">
                          {appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.value}% off` : `${formatPrice(appliedCoupon.value)} off`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAppliedCoupon(null)}
                      aria-label={`Remove coupon ${appliedCoupon.code}`}
                      className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-green-100"
                    >
                      <X className="h-3.5 w-3.5 text-green-600" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code..."
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      disabled={isValidating}
                      className="h-10 rounded-lg border-stone-gray/10"
                    />
                    <Button
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={isValidating || !couponInput.trim()}
                      className="h-10 rounded-lg px-4 text-sm font-medium"
                    >
                      {isValidating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col items-center space-y-3 pt-2">
              <Button 
                onClick={() => startCheckout(appliedCoupon?.code)}
                size="lg" 
                className="h-11 w-full max-w-sm rounded-lg text-sm font-semibold shadow-sm transition-all sm:w-auto sm:min-w-[240px]" 
                disabled={isProcessing || items.length === 0}
              >
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                {isProcessing ? 'Processing...' : `Pay Now · ${formatPrice(breakdown.total)}`}
              </Button>
              <p className="text-[10px] text-muted-foreground">
                Instant fulfillment • SSL encrypted
              </p>
            </div>
          </div>

          <div className="lg:col-span-5">
            <Card className="sticky top-32 rounded-xl border-stone-gray/10 bg-white p-5 shadow-sm overflow-hidden">
              <h4 className="mb-4 text-sm font-semibold font-headline text-midnight-ink">Order Summary</h4>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 pb-3 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-midnight-ink">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.category} × {item.quantity}</p>
                    </div>
                    <span className="text-xs font-semibold">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                
                <div className="space-y-2 border-t border-stone-gray/10 pt-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">{formatPrice(breakdown.subtotal)}</span>
                  </div>
                  {appliedCoupon && breakdown.discount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Discount ({appliedCoupon.code})</span>
                      <span className="font-medium text-green-600">−{formatPrice(breakdown.discount)}</span>
                    </div>
                  )}
                  <div className="flex items-baseline justify-between border-t border-stone-gray/10 pt-3">
                    <span className="text-xs font-semibold text-midnight-ink">Total</span>
                    <span className="text-lg font-bold tracking-tight text-primary">
                      {formatPrice(breakdown.total)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/10 bg-primary/5 p-3">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <p className="text-[10px] leading-relaxed text-slate-blue">
                  By completing this purchase you authorize instant electronic fulfillment. A perpetual digital license will be issued to your library.
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
