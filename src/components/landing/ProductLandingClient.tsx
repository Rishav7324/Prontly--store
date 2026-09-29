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
  Mail,
  Phone,
  User,
  Tag,
  Clock,
  Award,
  RefreshCw,
  HelpCircle,
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
    analytics.viewProduct(product);

    const handleScroll = () => {
      if (!checkoutFormRef.current) return;
      const rect = checkoutFormRef.current.getBoundingClientRect();
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
  const discountPercent = Math.max(15, Math.round(((comparePrice - rawPrice) / comparePrice) * 100));
  const savingsAmount = comparePrice - rawPrice;

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
        toast({ variant: 'destructive', title: 'Invalid Coupon', description: data.message || 'Please check the code.' });
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
        throw new Error('Payment gateway script is loading. Please try again.');
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
        theme: { color: '#09090b' },
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
              toast({ title: '🎉 Order Successful!', description: 'Your downloads and account details are ready.' });
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
      a: 'Immediately upon successful payment, your direct high-speed download link is unlocked on this screen. Additionally, we instantly dispatch a copy of your files, invoice, and commercial license certificate directly to your email address.',
    },
    {
      q: 'Do I get a commercial license to use this in client projects?',
      a: 'Yes! Every purchase on Prontly Store includes a perpetual commercial license. You are fully permitted to use this asset in unlimited client deliverables, personal commercial builds, and SaaS applications.',
    },
    {
      q: 'How do I access future updates or redownload files later?',
      a: 'When you purchase, your personal Prontly Creator Vault is automatically provisioned for your email. We email you a 1-click password setup link so you can log in anytime at store.prontly.in to download future patches and updates free forever.',
    },
    {
      q: 'What payment methods are supported?',
      a: 'We accept all major payment modes via Razorpay PCI-DSS Level 1 certified gateway: Instant UPI (Google Pay, PhonePe, Paytm, BHIM, Cred), Credit/Debit Cards (Visa, MasterCard, RuPay), and NetBanking across 50+ banks.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9] text-zinc-900 selection:bg-zinc-900 selection:text-white font-sans antialiased">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* ── 1. LUXURY MINIMAL AD HEADER ───────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-zinc-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
          
          {/* Official Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl overflow-hidden shadow-sm border border-zinc-200/70 transition-transform duration-300 group-hover:scale-105">
              <Image 
                src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" 
                alt="Prontly Logo" 
                fill 
                sizes="40px"
                className="object-cover" 
                priority 
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base sm:text-lg tracking-tight leading-none text-zinc-950 font-sans">
                Prontly
              </span>
              <span className="text-[10px] font-bold text-blue-600 tracking-wider uppercase leading-none mt-1 font-mono">
                Store Verified
              </span>
            </div>
          </Link>

          {/* Trust Indicators & Fast Support */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100/90 text-zinc-700 font-semibold border border-zinc-200 text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Official Verified Asset
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/80 text-[11px]">
              <Lock className="h-3 w-3 text-emerald-600" /> 256-Bit SSL
            </div>
            <a
              href="mailto:support@store.prontly.in?subject=Help%20with%20Product%20Purchase"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 text-white font-medium text-[11px] hover:bg-zinc-800 transition-colors shadow-xs"
            >
              <MessageSquare className="h-3 w-3" /> Support
            </a>
          </div>
        </div>
      </header>

      {/* ── 2. POST-PURCHASE CELEBRATION TERMINAL ─────────────── */}
      {purchasedOrder && (
        <section className="bg-zinc-950 text-white py-14 px-4 shadow-2xl animate-in fade-in duration-500 border-b border-zinc-800">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <div className="space-y-2">
              <div className="inline-block bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-500/20">
                FULFILLMENT COMPLETE
              </div>
              <h1 className="!font-sans text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Payment Confirmed! Your Files Are Ready 🚀
              </h1>
            </div>
            <p className="text-sm sm:text-base text-zinc-300 max-w-xl mx-auto leading-relaxed">
              Order <strong className="text-white font-mono">#{purchasedOrder.orderId.slice(-8).toUpperCase()}</strong> has been finalized. Tax invoice, digital download links, and your 1-click vault access token have been dispatched to <strong className="text-emerald-400 underline font-mono">{purchasedOrder.email}</strong>.
            </p>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="h-13 px-8 rounded-2xl font-bold bg-white text-zinc-950 hover:bg-zinc-100 shadow-xl transition-all">
                <Link href="/dashboard/orders">
                  <Download className="mr-2 h-4 w-4 text-emerald-600" /> Open My Vault & Downloads
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-13 px-6 rounded-2xl font-semibold border-zinc-700 text-zinc-200 hover:bg-zinc-900">
                <Link href={`/checkout/success?orderId=${purchasedOrder.orderId}`}>
                  View Tax Invoice & Receipt
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ── 3. HERO & 1-STEP CONVERSION SECTION ────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
        
        {/* Urgency Pill */}
        <div className="mb-6 flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/80 border border-blue-200/90 text-blue-700 text-xs font-bold tracking-wide shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping" />
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            SPECIAL DIRECT DEAL • SAVE {discountPercent}% TODAY
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-zinc-500">
            <Clock className="h-3.5 w-3.5 text-amber-500" /> Instant Access Available
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ── LEFT COLUMN: PRODUCT MEDIA & HIGHLIGHTS ── */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Title & Reviews */}
            <div className="space-y-3">
              <h1 className="!font-sans text-2xl sm:text-4xl md:text-5xl font-extrabold text-zinc-950 tracking-tight leading-[1.12]">
                {product.name}
              </h1>

              {/* Verified Rating & Avatar Social Proof */}
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs sm:text-sm text-zinc-600">
                <div className="flex -space-x-2 overflow-hidden py-1">
                  {['12', '33', '47', '68'].map((id) => (
                    <img
                      key={id}
                      className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover shadow-2xs"
                      src={`https://i.pravatar.cc/100?img=${id}`}
                      alt="Creator Avatar"
                    />
                  ))}
                </div>

                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-extrabold text-zinc-950 font-mono">
                  {(product.averageRating || 5.0).toFixed(1)}/5.0
                </span>
                <span className="text-zinc-400">•</span>
                <span className="text-zinc-600 font-medium">
                  {Math.max(product.reviewCount || 0, 24)} Verified Creators
                </span>
                <span className="text-zinc-400">•</span>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {Math.max(product.salesCount || 0, 310)}+ Downloads
                </Badge>
              </div>

              {product.shortDescription && (
                <p className="text-sm sm:text-base text-zinc-600 leading-relaxed pt-2 font-normal">
                  {product.shortDescription}
                </p>
              )}
            </div>

            {/* Main Mockup / Visual Bezel */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-3xl overflow-hidden border border-zinc-200/90 bg-white shadow-lg group">
              <Image
                src={images[selectedImgIndex]}
                alt={product.name}
                fill
                priority
                className="object-cover transition-transform duration-500 group-hover:scale-102"
              />
              <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                <Badge className="bg-zinc-950/90 backdrop-blur-md text-white font-bold text-xs px-3 py-1 rounded-xl shadow-xs uppercase tracking-wider">
                  {product.categorySlug || 'Asset'}
                </Badge>
                {discountPercent > 0 && (
                  <Badge className="bg-emerald-600 text-white font-bold text-xs px-3 py-1 rounded-xl shadow-xs">
                    Save {discountPercent}%
                  </Badge>
                )}
              </div>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImgIndex(idx)}
                    className={cn(
                      "relative h-18 w-18 sm:h-20 sm:w-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 bg-white",
                      selectedImgIndex === idx
                        ? "border-zinc-950 shadow-md scale-102 ring-2 ring-zinc-950/20"
                        : "border-zinc-200 opacity-60 hover:opacity-100"
                    )}
                  >
                    <Image src={img} alt={`Preview ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* High-Impact Value Checklist */}
            <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="!font-sans text-xs font-extrabold uppercase tracking-wider text-zinc-500">
                  Included in your purchase
                </h3>
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> Perpetual Ownership
                </span>
              </div>

              <ul className="space-y-3.5 text-xs sm:text-sm text-zinc-700">
                <li className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="h-3 w-3" />
                  </div>
                  <span><strong>Instant High-Speed Download:</strong> Immediate access to production-ready files via Cloudflare R2 edge network.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Award className="h-3 w-3" />
                  </div>
                  <span><strong>Perpetual Commercial License:</strong> Unlimited personal, agency, and commercial client project deployment rights.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <RefreshCw className="h-3 w-3" />
                  </div>
                  <span><strong>Free Lifetime Updates:</strong> Download all future versions, enhancements, and compatibility patches free forever.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                    <FileCode className="h-3 w-3" />
                  </div>
                  <span><strong>Complete Source & Setup Guide:</strong> Clean documentation, step-by-step instructions, and raw source assets.</span>
                </li>
              </ul>
            </div>

            {/* Technical Metadata Spec Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'File Format', val: product.fileFormat || 'ZIP / Source', icon: FileCode },
                { label: 'Version', val: `v${product.fileVersion || '1.0'}`, icon: Zap },
                { label: 'License', val: 'Perpetual', icon: ShieldCheck },
                { label: 'Tech Support', val: 'Included Free', icon: MessageSquare },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-2xl border border-zinc-200 p-3.5 shadow-2xs">
                  <item.icon className="h-4 w-4 text-zinc-900 mb-1" />
                  <p className="text-[10px] uppercase font-bold text-zinc-400 font-mono">{item.label}</p>
                  <p className="text-xs font-bold text-zinc-900 truncate mt-0.5">{item.val}</p>
                </div>
              ))}
            </div>

          </div>

          {/* ── RIGHT COLUMN: HIGH-CONVERTING 1-STEP CHECKOUT TERMINAL ── */}
          <div className="lg:col-span-5" ref={checkoutFormRef}>
            <div className="sticky top-20">
              <Card className="rounded-3xl border border-zinc-200 bg-white shadow-2xl overflow-hidden ring-1 ring-zinc-950/5">
                
                {/* Sleek Terminal Header */}
                <div className="bg-zinc-950 px-6 py-4.5 text-white flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-zinc-100 font-mono">
                      <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                      1-Step Express Checkout
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      No password required • Instant fulfillment
                    </p>
                  </div>
                  <Badge variant="outline" className="border-zinc-700 text-emerald-400 font-mono text-[10px] bg-zinc-900 px-2.5 py-1">
                    Instant Access
                  </Badge>
                </div>

                <CardContent className="p-6 sm:p-7 space-y-6">
                  
                  {/* Pricing Display */}
                  <div className="flex items-baseline justify-between border-b border-zinc-100 pb-5">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-950 font-mono">
                          ₹{(breakdown.total / 100).toLocaleString('en-IN')}
                        </span>
                        {comparePrice > rawPrice && (
                          <span className="text-sm text-zinc-400 line-through font-mono">
                            ₹{(comparePrice / 100).toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        One-time payment • Lifetime commercial license
                      </p>
                    </div>

                    <div className="text-right">
                      <Badge className="bg-emerald-600 text-white font-bold text-xs px-2.5 py-1 rounded-lg">
                        Save {discountPercent}%
                      </Badge>
                      {savingsAmount > 0 && (
                        <p className="text-[10px] text-emerald-600 font-bold mt-1">
                          You save ₹{(savingsAmount / 100).toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 1-Step Form */}
                  <form onSubmit={handleDirectPurchase} className="space-y-4">
                    
                    {/* Email Input (Mandatory) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="checkout-email" className="text-xs font-bold text-zinc-800 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-zinc-400" /> Email Address <span className="text-rose-500">*</span>
                        </span>
                        <span className="text-[10px] font-normal text-zinc-400">Downloads sent here</span>
                      </Label>
                      <Input
                        id="checkout-email"
                        type="email"
                        required
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 rounded-xl border-zinc-300 focus-visible:ring-zinc-950 text-sm bg-zinc-50/50"
                      />
                    </div>

                    {/* WhatsApp / Mobile Input (Mandatory) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="checkout-phone" className="text-xs font-bold text-zinc-800 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-zinc-400" /> Mobile / WhatsApp Number <span className="text-rose-500">*</span>
                        </span>
                        <span className="text-[10px] font-normal text-zinc-400">Delivery confirmation</span>
                      </Label>
                      <Input
                        id="checkout-phone"
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-11 rounded-xl border-zinc-300 focus-visible:ring-zinc-950 text-sm bg-zinc-50/50"
                      />
                    </div>

                    {/* Full Name (Optional) */}
                    <div className="space-y-1.5">
                      <Label htmlFor="checkout-name" className="text-xs font-bold text-zinc-800 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-zinc-400" /> Full Name
                        </span>
                        <span className="text-[10px] font-normal text-zinc-400">Optional for license</span>
                      </Label>
                      <Input
                        id="checkout-name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-11 rounded-xl border-zinc-300 focus-visible:ring-zinc-950 text-sm bg-zinc-50/50"
                      />
                    </div>

                    {/* Coupon Code Section */}
                    <div className="pt-1">
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs">
                          <div className="flex items-center gap-1.5 text-emerald-800 font-bold font-mono">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <span>{appliedCoupon.code} applied</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAppliedCoupon(null)}
                            className="text-zinc-400 hover:text-zinc-600 p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Discount / Coupon code"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                            className="h-9 rounded-lg text-xs font-mono"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isValidatingCoupon || !couponInput.trim()}
                            onClick={handleApplyCoupon}
                            className="h-9 rounded-lg text-xs px-3 font-bold"
                          >
                            {isValidatingCoupon ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Primary High-Impact CTA Button */}
                    <Button
                      type="submit"
                      disabled={isProcessing}
                      size="lg"
                      className="w-full h-13 rounded-2xl font-extrabold text-base bg-zinc-950 hover:bg-zinc-800 text-white shadow-xl active:scale-[0.98] transition-all"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Launching Razorpay...
                        </>
                      ) : (
                        <>
                          ⚡ Pay {formatPrice(breakdown.total)} & Download Now
                        </>
                      )}
                    </Button>

                    {/* Payment Gateways Bar */}
                    <div className="pt-3 text-center space-y-2 border-t border-zinc-100">
                      <div className="flex items-center justify-center gap-2.5 text-[11px] font-semibold text-zinc-500 font-mono">
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
                      <p className="text-[10px] text-zinc-400 flex items-center justify-center gap-1">
                        <Lock className="h-3 w-3 text-emerald-600" />
                        Razorpay PCI-DSS Level 1 Encrypted Terminal
                      </p>
                    </div>

                  </form>

                </CardContent>
              </Card>
            </div>
          </div>

        </div>

        {/* ── 4. DETAILED OVERVIEW ──────────────────────────────── */}
        <section className="mt-16 sm:mt-20 pt-12 border-t border-zinc-200">
          <div className="max-w-3xl space-y-6">
            <h2 className="!font-sans text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
              Detailed Product Overview
            </h2>

            {product.description ? (
              <div
                className="prose prose-zinc max-w-none text-sm sm:text-base leading-relaxed text-zinc-700"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : (
              <p className="text-sm text-zinc-600 leading-relaxed">
                This production asset has been thoroughly tested and vetted by Prontly. Download full source files, templates, and setup instructions immediately upon purchase.
              </p>
            )}
          </div>
        </section>

        {/* ── 5. FREQUENTLY ASKED QUESTIONS (FAQ) ──────────────── */}
        <section className="mt-16 pt-12 border-t border-zinc-200">
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="!font-sans text-2xl sm:text-3xl font-extrabold text-zinc-950 tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                Everything you need to know about purchasing, commercial licensing, and instant file access.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-2xl border border-zinc-200/90 overflow-hidden transition-all shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full px-5 py-4.5 text-left flex items-center justify-between gap-4 font-bold text-sm text-zinc-900 hover:text-blue-600 transition-colors"
                    >
                      <span className="font-sans">{faq.q}</span>
                      {isOpen ? <ChevronUp className="h-4 w-4 shrink-0 text-zinc-400" /> : <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs sm:text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">
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
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-zinc-200 p-3 sm:hidden shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="min-w-0">
            <p className="text-xs font-bold text-zinc-950 truncate font-sans">{product.name}</p>
            <p className="text-base font-extrabold text-zinc-950 font-mono">
              ₹{(breakdown.total / 100).toLocaleString('en-IN')}
            </p>
          </div>
          <Button
            size="lg"
            onClick={scrollToCheckout}
            className="h-11 px-6 rounded-xl font-bold bg-zinc-950 text-white shrink-0 shadow-md font-sans"
          >
            ⚡ Buy Now
          </Button>
        </div>
      )}

      {/* ── 7. FOOTER ─────────────────────────────────────────── */}
      <footer className="mt-20 border-t border-zinc-200 bg-white py-12 px-4 text-center text-xs text-zinc-500 space-y-3">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="relative h-6 w-6 rounded-lg overflow-hidden border border-zinc-200">
            <Image 
              src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" 
              alt="Prontly Logo" 
              fill 
              sizes="24px"
              className="object-cover" 
            />
          </div>
          <span className="font-extrabold text-zinc-900 tracking-tight font-sans text-sm">
            Prontly Store
          </span>
        </div>
        <p className="font-medium text-zinc-600">
          © {new Date().getFullYear()} Prontly Technologies — Verified Digital Assets & Tooling for Modern Creators.
        </p>
        <p className="text-[11px] text-zinc-400 max-w-xl mx-auto">
          Need assistance or custom requirements? Email us anytime at <a href="mailto:support@store.prontly.in" className="text-blue-600 underline font-semibold">support@store.prontly.in</a>.
        </p>
      </footer>

    </div>
  );
}
