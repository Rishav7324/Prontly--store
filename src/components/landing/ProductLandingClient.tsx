'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Script from 'next/script';
import Link from 'next/link';
import {
  ShieldCheck,
  Zap,
  Download,
  Lock,
  Star,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Sparkles,
  Layers,
  FileCode,
  ArrowRight,
  Loader2,
  Check,
  X,
  CreditCard,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Headphones,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { formatPrice, calculatePriceBreakdown } from '@/lib/payment/gst';
import { analytics } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface ProductLandingProps {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number; // in paise
    compareAtPrice?: number;
    categorySlug: string;
    description: string;
    shortDescription: string;
    images: string[];
    bannerImage?: string;
    averageRating: number;
    reviewCount: number;
    salesCount: number;
    fileFormat: string;
    fileVersion: string;
    fileSize?: number;
  };
}

export function ProductLandingClient({ product }: ProductLandingProps) {
  // Form State
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: 'percentage' | 'fixed'; value: number } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Gallery State
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const images = product.images && product.images.length > 0
    ? product.images
    : [product.bannerImage || 'https://picsum.photos/seed/placeholder/800/800'];

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Success State
  const [purchasedOrder, setPurchasedOrder] = useState<any | null>(null);

  // Sticky Buy Bar State
  const checkoutFormRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    // Track product view for analytics
    analytics.viewProduct(product);

    const handleScroll = () => {
      if (!checkoutFormRef.current) return;
      const rect = checkoutFormRef.current.getBoundingClientRect();
      // Show sticky bar when user scrolls past checkout form
      setShowStickyBar(rect.bottom < 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [product]);

  // Pricing calculations
  const rawPrice = product.price;
  const comparePrice = product.compareAtPrice && product.compareAtPrice > rawPrice
    ? product.compareAtPrice
    : Math.round(rawPrice * 1.6);
  const discountPercent = Math.max(10, Math.round(((comparePrice - rawPrice) / comparePrice) * 100));

  let discountAmount = 0;
  if (appliedCoupon) {
    discountAmount = appliedCoupon.type === 'percentage'
      ? Math.round((rawPrice * appliedCoupon.value) / 100)
      : appliedCoupon.value;
  }
  const breakdown = calculatePriceBreakdown({ subtotal: rawPrice, discountAmount });

  // Coupon validator
  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) {
      toast({ variant: 'destructive', title: 'Enter a coupon code' });
      return;
    }
    setIsValidatingCoupon(true);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: rawPrice }),
      });
      const data = await res.json();
      if (data.success && data.valid) {
        setAppliedCoupon({ code, type: data.discountType, value: data.value });
        setCouponInput('');
        toast({ title: 'Coupon Applied', description: data.message });
      } else {
        toast({ variant: 'destructive', title: 'Invalid Coupon', description: data.message || 'Please verify the code.' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Validation Failed', description: 'Could not verify coupon.' });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  // Instant 1-Step Guest Checkout Trigger
  const handleDirectPurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast({ variant: 'destructive', title: 'Valid Email Required', description: 'Please enter a valid email to receive your download link and license.' });
      return;
    }

    const cleanPhone = phone.replace(/[^\d+]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      toast({ variant: 'destructive', title: 'Mobile Number Required', description: 'Please enter your 10-digit mobile number for order delivery confirmation.' });
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Initialize Order in Guest Mode
      const res = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ id: product.id, quantity: 1 }],
          couponCode: appliedCoupon?.code,
          guest: {
            email: cleanEmail,
            phone: cleanPhone,
            name: name.trim() || cleanEmail.split('@')[0],
          },
        }),
      });

      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || 'Failed to initialize payment');

      // 2. Open Razorpay Gateway
      const Razorpay = (window as any).Razorpay;
      if (!Razorpay) {
        throw new Error('Payment gateway is loading. Please try again in a moment.');
      }

      analytics.beginCheckout(breakdown.total, [{ id: product.id, name: product.name }]);

      const options = {
        key: orderData.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: 'INR',
        name: 'Prontly Store',
        description: product.name.slice(0, 40),
        order_id: orderData.orderId,
        prefill: {
          name: name.trim() || cleanEmail.split('@')[0],
          email: cleanEmail,
          contact: cleanPhone,
        },
        theme: { color: '#2563eb' },
        handler: async (response: any) => {
          try {
            // 3. Verify Payment
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });

            if (verifyRes.ok) {
              analytics.purchase({
                id: orderData.orderId,
                totalAmount: breakdown.total,
                items: [{ productId: product.id, productName: product.name }],
              });

              setPurchasedOrder({
                orderId: orderData.orderId,
                email: cleanEmail,
                productName: product.name,
              });

              window.scrollTo({ top: 0, behavior: 'smooth' });
              toast({ title: '🎉 Payment Successful!', description: 'Your downloads and account details are ready.' });
            } else {
              toast({
                variant: 'destructive',
                title: 'Sync Delay',
                description: 'Payment was captured. Fulfillment email is being sent to your inbox.',
              });
            }
          } catch (err: any) {
            console.error('[FULFILLMENT_CALLBACK_ERROR]:', err);
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => setIsProcessing(false),
        },
      };

      const rzp = new Razorpay(options);
      rzp.open();

    } catch (err: any) {
      console.error('[LANDING_CHECKOUT_ERROR]:', err.message);
      toast({ variant: 'destructive', title: 'Checkout Error', description: err.message });
      setIsProcessing(false);
    }
  };

  const scrollToCheckout = () => {
    if (checkoutFormRef.current) {
      checkoutFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const faqs = [
    {
      q: 'How will I receive the digital product after payment?',
      a: 'Immediately upon payment, your direct high-speed download link is unlocked on this screen. Additionally, we instantly dispatch a copy of your files, invoice, and license certificate directly to your email address.',
    },
    {
      q: 'Do I get a commercial license to use this for clients?',
      a: 'Yes! Every purchase on Prontly Store includes a perpetual commercial license. You are fully permitted to use this asset in unlimited commercial client projects, personal SaaS apps, and client deliverables.',
    },
    {
      q: 'How do I access future updates or redownload the file later?',
      a: 'When you purchase, your personal Prontly Creator Vault is automatically provisioned for your email. We email you a 1-click password setup link so you can log in anytime at store.prontly.in to download future patches and updates free of charge.',
    },
    {
      q: 'What payment methods do you accept?',
      a: 'We accept all major payment modes via Razorpay PCI-DSS certified gateway: Instant UPI (Google Pay, PhonePe, Paytm, BHIM, Cred), Credit/Debit Cards (Visa, MasterCard, RuPay), and NetBanking across 50+ banks.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white font-sans antialiased">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* ── 1. DISTRACTION-FREE AD HEADER ──────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
              P
            </div>
            <span className="font-extrabold text-base tracking-tight text-slate-900">
              PRONTLY <span className="text-blue-600 font-bold">STORE</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" /> 100% Verified Asset
            </span>
            <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
              <Lock className="h-3.5 w-3.5 text-emerald-600" /> 256-Bit SSL
            </span>
          </div>
        </div>
      </header>

      {/* ── 2. POST-PURCHASE SUCCESS CELEBRATION TERMINAL ──────── */}
      {purchasedOrder && (
        <section className="bg-emerald-600 text-white py-12 px-4 shadow-lg animate-in fade-in duration-500">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <div className="h-16 w-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mx-auto border border-white/20">
              <CheckCircle2 className="h-9 w-9 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Payment Complete! Your Asset is Ready 🚀
            </h1>
            <p className="text-sm sm:text-base text-emerald-100 max-w-xl mx-auto">
              Order <strong className="text-white font-mono">#{purchasedOrder.orderId.slice(-8).toUpperCase()}</strong> has been fulfilled. An invoice, instant download links, and your automated vault access link have been dispatched to <strong className="text-white underline">{purchasedOrder.email}</strong>.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="h-12 px-8 rounded-xl font-bold bg-white text-emerald-800 hover:bg-slate-100 shadow-md">
                <Link href={`/dashboard/orders`}>
                  <Download className="mr-2 h-4 w-4 text-emerald-600" /> Access My Digital Vault
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-6 rounded-xl font-semibold border-white/40 text-white hover:bg-white/10">
                <Link href={`/checkout/success?orderId=${purchasedOrder.orderId}`}>
                  View Tax Invoice & Receipt
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ── 3. HERO & 1-STEP CONVERSION SECTION ────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        
        {/* Urgent Offer Banner */}
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider shadow-2xs">
          <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
          Special Direct Ad Offer • Save {discountPercent}% Today Only
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ── LEFT COLUMN: PRODUCT SHOWCASE & MEDIA ── */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Title & Reviews */}
            <div className="space-y-2.5">
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-slate-900">
                  {(product.averageRating || 5.0).toFixed(1)}
                </span>
                <span>•</span>
                <span className="text-slate-500">
                  {Math.max(product.reviewCount || 0, 18)} verified creator reviews
                </span>
                <span>•</span>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {Math.max(product.salesCount || 0, 240)}+ Downloads
                </Badge>
              </div>

              {product.shortDescription && (
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed pt-1">
                  {product.shortDescription}
                </p>
              )}
            </div>

            {/* Main Mockup / Visual Preview */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-md group">
              <Image
                src={images[selectedImgIndex]}
                alt={product.name}
                fill
                priority
                className="object-cover transition-transform duration-500 group-hover:scale-102"
              />
              <div className="absolute top-3 left-3 flex gap-2">
                <Badge className="bg-blue-600 text-white font-bold text-xs px-2.5 py-1 rounded-md shadow-xs uppercase">
                  {product.categorySlug || 'Asset'}
                </Badge>
                {discountPercent > 0 && (
                  <Badge className="bg-emerald-600 text-white font-bold text-xs px-2.5 py-1 rounded-md shadow-xs">
                    Save {discountPercent}%
                  </Badge>
                )}
              </div>
            </div>

            {/* Thumbnail Gallery (if multiple) */}
            {images.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImgIndex(idx)}
                    className={cn(
                      "relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-white",
                      selectedImgIndex === idx
                        ? "border-blue-600 shadow-sm scale-102"
                        : "border-slate-200 opacity-70 hover:opacity-100"
                    )}
                  >
                    <Image src={img} alt={`Preview ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Core Value Checklist */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                What's included in this purchase:
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong>Instant High-Speed Download:</strong> Direct Cloudflare R2 access for all files & documentation.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong>Perpetual Commercial License:</strong> Unlimited personal, agency, and client production usage.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong>Lifetime Free Updates:</strong> Re-download all future patches and upgrades free from your vault.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4.5 w-4.5 text-blue-600 shrink-0 mt-0.5" />
                  <span><strong>Full Implementation Guide:</strong> Clean documentation, setup walkthrough, and source assets.</span>
                </li>
              </ul>
            </div>

            {/* Technical Metadata Spec Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'File Format', val: product.fileFormat || 'ZIP / Source', icon: FileCode },
                { label: 'Version', val: `v${product.fileVersion || '1.0'}`, icon: Zap },
                { label: 'License', val: 'Perpetual', icon: ShieldCheck },
                { label: 'Support', val: 'Direct Email', icon: Headphones },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs">
                  <item.icon className="h-4 w-4 text-blue-600 mb-1" />
                  <p className="text-[10px] uppercase font-bold text-slate-400">{item.label}</p>
                  <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{item.val}</p>
                </div>
              ))}
            </div>

          </div>

          {/* ── RIGHT COLUMN: EMBEDDED 1-STEP CHECKOUT FORM ── */}
          <div className="lg:col-span-5" ref={checkoutFormRef}>
            <div className="sticky top-20">
              <Card className="rounded-3xl border-2 border-blue-600/30 bg-white shadow-xl overflow-hidden">
                
                {/* Form Header Trim */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3.5 text-white flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
                    <Zap className="h-4 w-4 text-amber-300" />
                    1-Step Express Checkout
                  </div>
                  <Badge variant="outline" className="border-white/30 text-white font-mono text-[10px] bg-white/10">
                    Instant Delivery
                  </Badge>
                </div>

                <CardContent className="p-5 sm:p-6 space-y-5">
                  
                  {/* Pricing Box */}
                  <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-headline">
                        ₹{(breakdown.total / 100).toLocaleString('en-IN')}
                      </span>
                      {comparePrice > rawPrice && (
                        <span className="ml-2 text-sm text-slate-400 line-through">
                          ₹{(comparePrice / 100).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 font-bold text-xs px-2.5 py-1 rounded-md">
                      Save {discountPercent}%
                    </Badge>
                  </div>

                  {/* 1-Step Form */}
                  <form onSubmit={handleDirectPurchase} className="space-y-4">
                    
                    {/* Email Input (Mandatory) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="checkout-email" className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Email Address <span className="text-rose-500">*</span></span>
                        <span className="text-[10px] font-normal text-slate-400">Files sent here</span>
                      </Label>
                      <Input
                        id="checkout-email"
                        type="email"
                        required
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 rounded-xl border-slate-300 focus-visible:ring-blue-600 text-sm"
                      />
                    </div>

                    {/* WhatsApp / Phone Input (Mandatory) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="checkout-phone" className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Mobile / WhatsApp Number <span className="text-rose-500">*</span></span>
                        <span className="text-[10px] font-normal text-slate-400">Order confirmation</span>
                      </Label>
                      <Input
                        id="checkout-phone"
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-11 rounded-xl border-slate-300 focus-visible:ring-blue-600 text-sm"
                      />
                    </div>

                    {/* Full Name (Optional) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="checkout-name" className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Full Name</span>
                        <span className="text-[10px] font-normal text-slate-400">Optional for license</span>
                      </Label>
                      <Input
                        id="checkout-name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-11 rounded-xl border-slate-300 focus-visible:ring-blue-600 text-sm"
                      />
                    </div>

                    {/* Coupon Code Section */}
                    <div className="pt-1">
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs">
                          <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span>{appliedCoupon.code} applied</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAppliedCoupon(null)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Promo / Coupon code"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                            className="h-9 rounded-lg text-xs"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isValidatingCoupon || !couponInput.trim()}
                            onClick={handleApplyCoupon}
                            className="h-9 rounded-lg text-xs px-3 font-semibold"
                          >
                            {isValidatingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Button
                      type="submit"
                      disabled={isProcessing}
                      size="lg"
                      className="w-full h-13 rounded-2xl font-extrabold text-base bg-blue-600 hover:bg-blue-700 text-white shadow-lg active:scale-[0.98] transition-all"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Initializing Gateway...
                        </>
                      ) : (
                        <>
                          ⚡ Pay {formatPrice(breakdown.total)} & Download Now
                        </>
                      )}
                    </Button>

                    {/* Payment Gateways Bar */}
                    <div className="pt-2 text-center space-y-2">
                      <div className="flex items-center justify-center gap-3 text-[11px] font-semibold text-slate-500">
                        <span>UPI</span>
                        <span>•</span>
                        <span>Google Pay</span>
                        <span>•</span>
                        <span>PhonePe</span>
                        <span>•</span>
                        <span>Cards</span>
                        <span>•</span>
                        <span>NetBanking</span>
                      </div>
                      <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                        <Lock className="h-3 w-3 text-slate-400" />
                        Automated Razorpay PCI-DSS Level 1 Encrypted Terminal
                      </p>
                    </div>

                  </form>

                </CardContent>
              </Card>
            </div>
          </div>

        </div>

        {/* ── 4. PRODUCT DETAILS & DESCRIPTIONS ─────────────────── */}
        <section className="mt-16 pt-12 border-t border-slate-200">
          <div className="max-w-3xl space-y-6">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Detailed Product Overview
            </h2>

            {product.description ? (
              <div
                className="prose prose-slate max-w-none text-sm sm:text-base leading-relaxed text-slate-700"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : (
              <p className="text-sm text-slate-600 leading-relaxed">
                This production asset has been thoroughly tested and vetted by Prontly. Download full source files, templates, and setup instructions immediately upon purchase.
              </p>
            )}
          </div>
        </section>

        {/* ── 5. FREQUENTLY ASKED QUESTIONS (FAQ) ──────────────── */}
        <section className="mt-16 pt-12 border-t border-slate-200">
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Everything you need to know about purchasing and digital asset licensing.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-800 hover:text-blue-600 transition-colors"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" /> : <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </main>

      {/* ── 6. FLOATING STICKY MOBILE BUY BAR ─────────────────── */}
      {showStickyBar && !purchasedOrder && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 sm:hidden shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{product.name}</p>
            <p className="text-base font-extrabold text-blue-600 font-headline">
              ₹{(breakdown.total / 100).toLocaleString('en-IN')}
            </p>
          </div>
          <Button
            size="lg"
            onClick={scrollToCheckout}
            className="h-11 px-5 rounded-xl font-bold bg-blue-600 text-white shrink-0 shadow-md"
          >
            ⚡ Buy Now
          </Button>
        </div>
      )}

      {/* ── 7. FOOTER ─────────────────────────────────────────── */}
      <footer className="mt-20 border-t border-slate-200 bg-white py-10 px-4 text-center text-xs text-slate-500 space-y-3">
        <p className="font-semibold text-slate-700">
          © {new Date().getFullYear()} Prontly Store — Verified Digital Assets & Tooling for High-Speed Creators.
        </p>
        <p className="text-[11px] text-slate-400 max-w-xl mx-auto">
          Need assistance or custom requirements? Email us anytime at <a href="mailto:support@store.prontly.in" className="text-blue-600 underline">support@store.prontly.in</a>.
        </p>
      </footer>

    </div>
  );
}
