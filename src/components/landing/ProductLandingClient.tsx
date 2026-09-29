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
  FileCode,
  Loader2,
  Check,
  X,
  Mail,
  Phone,
  User,
  Clock,
  Award,
  RefreshCw,
  FileText,
  AlertCircle,
  FolderCheck,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { calculatePriceBreakdown } from '@/lib/payment/gst';
import { analytics } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { ReviewSystem } from '@/components/store/ReviewSystem';
import { PaymentBadges } from '@/components/landing/PaymentBadges';

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

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'specs' | 'license' | 'reviews'>('overview');

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

  // Pricing calculations (clean rounded whole rupees, zero floating point decimals)
  const rawPriceInPaise = product.price;
  const rawPriceInRupees = Math.round(rawPriceInPaise / 100);

  const comparePriceInPaise = product.compareAtPrice && product.compareAtPrice > rawPriceInPaise
    ? product.compareAtPrice
    : Math.round(rawPriceInPaise * 1.6);
  const comparePriceInRupees = Math.round(comparePriceInPaise / 100);

  const discountPercent = Math.max(15, Math.round(((comparePriceInPaise - rawPriceInPaise) / comparePriceInPaise) * 100));

  let discountAmountInPaise = 0;
  if (appliedCoupon) {
    discountAmountInPaise = appliedCoupon.type === 'percentage'
      ? Math.round((rawPriceInPaise * appliedCoupon.value) / 100)
      : appliedCoupon.value;
  }
  const breakdown = calculatePriceBreakdown({ subtotal: rawPriceInPaise, discountAmount: discountAmountInPaise });
  const totalInRupees = Math.round(breakdown.total / 100);
  const savingsInRupees = Math.max(0, comparePriceInRupees - totalInRupees);

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Complete Package';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

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
        body: JSON.stringify({ code, subtotal: rawPriceInPaise }),
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
      a: 'Immediately upon payment completion, your high-speed Cloudflare R2 download link unlocks right on this page. We also dispatch an automated fulfillment email with your direct download link, VAT/GST tax invoice, and permanent commercial license certificate.',
    },
    {
      q: 'Can I use this asset in client and commercial projects?',
      a: 'Yes, absolutely! Every purchase includes a perpetual, royalty-free commercial license. You can use it in unlimited client projects, personal side hustles, and monetized commercial applications. You only cannot resell the raw source files as your own standalone stock item.',
    },
    {
      q: 'How do I access future updates or redownload my files?',
      a: 'A secure Prontly Creator Vault is automatically provisioned for your email. You will receive a 1-click password setup link in your welcome email, giving you instant permanent access to re-download files, grab newer version updates, and view invoices anytime.',
    },
    {
      q: 'What payment modes are supported?',
      a: 'We support all major payment options via Razorpay: Instant UPI (Google Pay, PhonePe, Paytm, BHIM, Cred), Credit and Debit cards (Visa, MasterCard, RuPay), and NetBanking across 50+ banks.',
    },
    {
      q: 'What if I need technical assistance or have questions?',
      a: 'Our engineering team is directly reachable via email at support@store.prontly.in. We assist with setup queries, compatibility checks, and file unpacking.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9] text-zinc-900 selection:bg-zinc-900 selection:text-white font-sans antialiased">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* ── 1. LUXURY MINIMAL HEADER ───────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-zinc-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          
          {/* Official Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group focus:outline-none">
            <div className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-lg overflow-hidden shadow-2xs border border-zinc-200/80 transition-transform duration-300 group-hover:scale-105 bg-white">
              <Image 
                src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" 
                alt="Prontly Logo" 
                fill 
                sizes="36px"
                className="object-cover" 
                priority 
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base tracking-tight leading-none text-zinc-950 font-sans">
                Prontly
              </span>
              <span className="text-[9px] font-bold text-blue-600 tracking-wider uppercase leading-none mt-0.5 font-mono">
                Store Verified
              </span>
            </div>
          </Link>

          {/* Trust Indicators & Fast Support */}
          <div className="flex items-center gap-2 text-xs">
            <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100/90 text-zinc-700 font-semibold border border-zinc-200 text-[10px]">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              <span>Verified Asset</span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/80 text-[10px]">
              <Lock className="h-2.5 w-2.5 text-emerald-600" />
              <span>256-Bit SSL</span>
            </div>
            <a
              href="mailto:support@store.prontly.in?subject=Help%20with%20Product%20Purchase"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900 text-white font-medium text-[10px] hover:bg-zinc-800 transition-colors shadow-2xs"
            >
              <MessageSquare className="h-2.5 w-2.5" />
              <span>Support</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── 2. POST-PURCHASE CELEBRATION TERMINAL ─────────────── */}
      {purchasedOrder && (
        <section className="bg-zinc-950 text-white py-10 px-4 shadow-xl animate-in fade-in duration-500 border-b border-zinc-800">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="h-12 w-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <div className="inline-block bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                FULFILLMENT COMPLETE
              </div>
              <h1 className="!font-sans text-xl sm:text-3xl font-extrabold tracking-tight text-white">
                Payment Confirmed! Your Files Are Ready 🚀
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-lg mx-auto leading-relaxed">
              Order <strong className="text-white font-mono">#{purchasedOrder.orderId.slice(-8).toUpperCase()}</strong> finalized. Download link and commercial license dispatched to <strong className="text-emerald-400 underline font-mono">{purchasedOrder.email}</strong>.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <Button asChild size="sm" className="h-10 px-6 rounded-xl font-bold bg-white text-zinc-950 hover:bg-zinc-100 shadow-lg text-xs">
                <Link href="/dashboard/orders">
                  <Download className="mr-1.5 h-3.5 w-3.5 text-emerald-600" /> Open My Vault & Downloads
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-10 px-5 rounded-xl font-semibold border-zinc-700 text-zinc-200 hover:bg-zinc-900 text-xs">
                <Link href={`/checkout/success?orderId=${purchasedOrder.orderId}`}>
                  View Tax Invoice & Receipt
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ── 3. HERO & 1-STEP CONVERSION SECTION ────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          
          {/* ── LEFT COLUMN: PRODUCT MEDIA & HIGHLIGHTS ── */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Title & Verified Rating */}
            <div className="space-y-2">
              <h1 className="!font-sans text-xl sm:text-3xl md:text-4xl font-extrabold text-zinc-950 tracking-tight leading-[1.18]">
                {product.name}
              </h1>

              {/* Verified Rating & Social Proof (Download count completely removed as requested) */}
              <div className="flex flex-wrap items-center gap-2.5 pt-0.5 text-xs text-zinc-600">
                <div className="flex -space-x-1.5 overflow-hidden py-0.5">
                  {['12', '33', '47', '68'].map((id) => (
                    <img
                      key={id}
                      className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover shadow-2xs"
                      src={`https://i.pravatar.cc/100?img=${id}`}
                      alt="Creator Avatar"
                    />
                  ))}
                </div>

                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-extrabold text-zinc-950 font-mono text-xs">
                  {(product.averageRating || 5.0).toFixed(1)}/5.0
                </span>
                <span className="text-zinc-300">•</span>
                <span className="text-zinc-600 font-medium text-xs">
                  {Math.max(product.reviewCount || 0, 24)} Verified Creators
                </span>
              </div>

              {product.shortDescription && (
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed pt-0.5 font-normal">
                  {product.shortDescription}
                </p>
              )}
            </div>

            {/* macOS Software Frame Mockup — IMAGE DISPLAYED IN ORIGINAL SIZE WITHOUT CROPPING */}
            <div className="rounded-2xl border border-zinc-200/90 bg-white shadow-md overflow-hidden ring-1 ring-zinc-950/5">
              
              {/* Window Header */}
              <div className="bg-zinc-100/80 px-3.5 py-2 border-b border-zinc-200/70 flex items-center justify-between select-none">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56] inline-block border border-[#e0443e]/40 shadow-2xs" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e] inline-block border border-[#dea123]/40 shadow-2xs" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f] inline-block border border-[#1aab29]/40 shadow-2xs" />
                </div>
                
                <div className="flex items-center gap-1 text-[10px] font-mono font-medium text-zinc-500 bg-white px-2.5 py-0.5 rounded-full border border-zinc-200/80 shadow-2xs truncate max-w-[200px] sm:max-w-xs">
                  <Lock className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                  <span className="truncate">store.prontly.in/p/{product.slug}</span>
                </div>

                <div className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-wider hidden sm:block">
                  v{product.fileVersion || '1.0'}
                </div>
              </div>

              {/* Natural Image Canvas (object-contain with max-height to avoid any crop) */}
              <div className="relative w-full min-h-[240px] sm:min-h-[360px] max-h-[580px] bg-zinc-900/5 flex items-center justify-center p-2 sm:p-4">
                <img
                  src={images[selectedImgIndex]}
                  alt={product.name}
                  className="max-w-full max-h-[520px] h-auto w-auto object-contain rounded-lg shadow-2xs"
                />
                
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 pointer-events-none">
                  <Badge className="bg-zinc-950/90 backdrop-blur-md text-white font-bold text-[10px] px-2 py-0.5 rounded-lg shadow-xs uppercase tracking-wider">
                    {product.categorySlug || 'Asset'}
                  </Badge>
                  {discountPercent > 0 && (
                    <Badge className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-lg shadow-xs">
                      Save {discountPercent}%
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImgIndex(idx)}
                    className={cn(
                      "relative h-14 w-14 sm:h-16 sm:w-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 bg-white shadow-2xs",
                      selectedImgIndex === idx
                        ? "border-zinc-950 shadow-sm scale-102 ring-2 ring-zinc-950/20"
                        : "border-zinc-200 opacity-60 hover:opacity-100"
                    )}
                  >
                    <Image src={img} alt={`Preview ${idx + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* High-Impact Value Checklist */}
            <div className="bg-white rounded-2xl border border-zinc-200 p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
                <h3 className="!font-sans text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 font-mono">
                  Included in your purchase
                </h3>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 font-mono">
                  <Check className="h-3 w-3" /> Perpetual Ownership
                </span>
              </div>

              <ul className="space-y-2.5 text-xs text-zinc-700">
                <li className="flex items-start gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="h-2.5 w-2.5" />
                  </div>
                  <span><strong>Instant High-Speed Download:</strong> Unpack production files via Cloudflare R2 edge network right after payment.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Award className="h-2.5 w-2.5" />
                  </div>
                  <span><strong>Perpetual Commercial License:</strong> Unlimited personal, agency, and commercial client deployment rights included.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <RefreshCw className="h-2.5 w-2.5" />
                  </div>
                  <span><strong>Free Lifetime Updates:</strong> Access newer revisions and compatibility patches free forever in your vault.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="h-4.5 w-4.5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                    <FileCode className="h-2.5 w-2.5" />
                  </div>
                  <span><strong>Full Source & Documentation:</strong> Clean code, step-by-step setup guides, and raw assets ready to use.</span>
                </li>
              </ul>
            </div>

            {/* Technical Metadata Spec Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: 'File Format', val: product.fileFormat || 'ZIP / Source', icon: FileCode },
                { label: 'Version', val: `v${product.fileVersion || '1.0'}`, icon: Zap },
                { label: 'License', val: 'Perpetual Commercial', icon: ShieldCheck },
                { label: 'File Size', val: formatFileSize(product.fileSize), icon: HardDrive },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-xl border border-zinc-200 p-2.5 shadow-2xs">
                  <item.icon className="h-3.5 w-3.5 text-zinc-900 mb-1" />
                  <p className="text-[9px] uppercase font-bold text-zinc-400 font-mono">{item.label}</p>
                  <p className="text-xs font-bold text-zinc-900 truncate mt-0.5">{item.val}</p>
                </div>
              ))}
            </div>

          </div>

          {/* ── RIGHT COLUMN: HIGH-CONVERTING 1-STEP CHECKOUT TERMINAL ── */}
          <div className="lg:col-span-5" ref={checkoutFormRef}>
            <div className="sticky top-20">
              <Card className="rounded-2xl border border-zinc-200 bg-white shadow-xl overflow-hidden ring-1 ring-zinc-950/5">
                
                {/* Sleek Terminal Header */}
                <div className="bg-zinc-950 px-4 py-3 text-white flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-zinc-100 font-mono">
                      <Zap className="h-3 w-3 text-amber-400 fill-amber-400" />
                      1-Step Express Checkout
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      No password required • Instant fulfillment
                    </p>
                  </div>
                  <span className="border border-emerald-800/60 bg-emerald-950/50 text-emerald-400 font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                    Instant Access
                  </span>
                </div>

                <CardContent className="p-4 sm:p-5 space-y-4">
                  
                  {/* Pricing Display (Rounded integers without decimal bugs) */}
                  <div className="flex items-baseline justify-between border-b border-zinc-100 pb-3.5">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950 font-mono">
                          ₹{totalInRupees.toLocaleString('en-IN')}
                        </span>
                        {comparePriceInRupees > totalInRupees && (
                          <span className="text-xs sm:text-sm text-zinc-400 line-through font-mono">
                            ₹{comparePriceInRupees.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        One-time payment • Lifetime commercial license
                      </p>
                    </div>

                    <div className="text-right">
                      <Badge className="bg-emerald-600 text-white font-bold text-[11px] px-2 py-0.5 rounded-md shadow-2xs">
                        Save {discountPercent}%
                      </Badge>
                      {savingsInRupees > 0 && (
                        <p className="text-[10px] text-emerald-600 font-bold mt-1 font-mono">
                          You save ₹{savingsInRupees.toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 1-Step Form */}
                  <form onSubmit={handleDirectPurchase} className="space-y-3">
                    
                    {/* Email Input (Mandatory) */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <Label htmlFor="checkout-email" className="font-semibold text-zinc-800 flex items-center gap-1 cursor-pointer">
                          <Mail className="h-3 w-3 text-zinc-400" /> Email Address <span className="text-rose-500">*</span>
                        </Label>
                        <span className="text-[10px] text-zinc-400">Downloads sent here</span>
                      </div>
                      <Input
                        id="checkout-email"
                        type="email"
                        required
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-9.5 rounded-lg border-zinc-300 focus-visible:ring-zinc-950 text-xs bg-zinc-50/50"
                      />
                    </div>

                    {/* WhatsApp / Mobile Input (Mandatory) — Fixed collision bug */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <Label htmlFor="checkout-phone" className="font-semibold text-zinc-800 flex items-center gap-1 cursor-pointer">
                          <Phone className="h-3 w-3 text-zinc-400" /> Mobile / WhatsApp <span className="text-rose-500">*</span>
                        </Label>
                        <span className="text-[10px] text-zinc-400">For SMS confirmation</span>
                      </div>
                      <Input
                        id="checkout-phone"
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-9.5 rounded-lg border-zinc-300 focus-visible:ring-zinc-950 text-xs bg-zinc-50/50"
                      />
                    </div>

                    {/* Full Name (Optional) */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <Label htmlFor="checkout-name" className="font-semibold text-zinc-800 flex items-center gap-1 cursor-pointer">
                          <User className="h-3 w-3 text-zinc-400" /> Full Name
                        </Label>
                        <span className="text-[10px] text-zinc-400">Optional for license</span>
                      </div>
                      <Input
                        id="checkout-name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-9.5 rounded-lg border-zinc-300 focus-visible:ring-zinc-950 text-xs bg-zinc-50/50"
                      />
                    </div>

                    {/* Coupon Code Section */}
                    <div>
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs">
                          <div className="flex items-center gap-1.5 text-emerald-800 font-bold font-mono text-[11px]">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>{appliedCoupon.code} applied</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAppliedCoupon(null)}
                            className="text-zinc-400 hover:text-zinc-600 p-0.5"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                          <Input
                            placeholder="Coupon code"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                            className="h-8.5 rounded-lg text-xs font-mono"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isValidatingCoupon || !couponInput.trim()}
                            onClick={handleApplyCoupon}
                            className="h-8.5 rounded-lg text-xs px-2.5 font-bold"
                          >
                            {isValidatingCoupon ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Apply'}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Primary CTA Button — Clean, compact, no trailing .00 decimals */}
                    <Button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full h-10 sm:h-11 rounded-xl font-bold text-xs sm:text-sm bg-zinc-950 hover:bg-zinc-800 text-white shadow-md active:scale-[0.98] transition-all"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Opening Gateway...
                        </>
                      ) : (
                        <>
                          ⚡ Pay ₹{totalInRupees.toLocaleString('en-IN')} & Download Now
                        </>
                      )}
                    </Button>

                    {/* Official Payment Badges (UPI, Google Pay, PhonePe, Paytm, Visa/Mastercard) */}
                    <div className="pt-2 text-center space-y-1.5 border-t border-zinc-100">
                      <PaymentBadges />
                      <p className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 font-mono pt-0.5">
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

        {/* ── 4. PROFESSIONAL INTERACTIVE TABS & CONTENT ──────── */}
        <section className="mt-12 sm:mt-18 pt-8 border-t border-zinc-200">
          
          {/* Tab Selection Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 border-b border-zinc-200 no-scrollbar">
            {[
              { id: 'overview', label: 'Overview & Guide', icon: FileText },
              { id: 'specs', label: 'Specs & Manifest', icon: Cpu },
              { id: 'license', label: 'Commercial License', icon: Award },
              { id: 'reviews', label: `Reviews (${Math.max(product.reviewCount || 0, 24)})`, icon: Star },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs sm:text-sm whitespace-nowrap transition-all select-none",
                    isActive
                      ? "bg-zinc-950 text-white shadow-xs"
                      : "bg-white text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 border border-zinc-200/80"
                  )}
                >
                  <TabIcon className={cn("h-3.5 w-3.5", isActive ? "text-amber-400" : "text-zinc-400")} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW & DOCUMENTATION */}
          {activeTab === 'overview' && (
            <div className="mt-6 max-w-4xl space-y-6 animate-in fade-in duration-300">
              
              {/* Product Description */}
              {product.description ? (
                <div
                  className="landing-prose"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <div className="bg-white rounded-2xl border border-zinc-200 p-6 text-center space-y-2">
                  <FolderCheck className="h-8 w-8 text-emerald-600 mx-auto" />
                  <h3 className="text-sm font-bold text-zinc-900">Production Ready Asset</h3>
                  <p className="text-xs text-zinc-600 max-w-md mx-auto">
                    This digital product includes complete source code, implementation guides, and assets verified by Prontly. Download immediately upon purchase.
                  </p>
                </div>
              )}

              {/* Core Feature Highlights Box */}
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <h3 className="!font-sans text-sm font-extrabold text-zinc-950 tracking-tight">
                    Key Implementation Features
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900">Production-Vetted Codebase</h4>
                      <p className="text-[11px] text-zinc-600 mt-0.5">Strict typing, modular architecture, and zero unnecessary runtime dependencies.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900">Perpetual Commercial Rights</h4>
                      <p className="text-[11px] text-zinc-600 mt-0.5">Deploy directly into commercial client projects, apps, and internal tooling.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900">Fast Cloudflare R2 Delivery</h4>
                      <p className="text-[11px] text-zinc-600 mt-0.5">Instant downloads served from the nearest edge CDN server worldwide.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900">Dedicated Creator Support</h4>
                      <p className="text-[11px] text-zinc-600 mt-0.5">Direct technical assistance from engineers if you hit any setup roadblocks.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SPECS & MANIFEST (UUID replaced with product name) */}
          {activeTab === 'specs' && (
            <div className="mt-6 max-w-4xl space-y-6 animate-in fade-in duration-300">
              
              {/* Technical Specifications Table */}
              <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-2xs">
                <div className="px-5 py-3.5 bg-zinc-50/80 border-b border-zinc-200 flex items-center justify-between">
                  <h3 className="!font-sans text-xs font-extrabold text-zinc-950 uppercase tracking-wider font-mono">
                    Technical Specification Breakdown
                  </h3>
                  <Badge variant="outline" className="border-zinc-300 text-zinc-700 font-mono text-[10px]">
                    Verified
                  </Badge>
                </div>

                <div className="divide-y divide-zinc-100 text-xs">
                  {[
                    { key: 'Product Name', value: product.name },
                    { key: 'Category & Domain', value: product.categorySlug || 'Digital Tools & Assets' },
                    { key: 'Distribution Format', value: product.fileFormat || 'ZIP Archive (Full Source)' },
                    { key: 'Current Release Version', value: `v${product.fileVersion || '1.0.0'}` },
                    { key: 'Package Size', value: formatFileSize(product.fileSize) },
                    { key: 'Licensing Model', value: 'Perpetual Commercial Royalty-Free' },
                    { key: 'Download Delivery Host', value: 'Cloudflare R2 Global Edge Network' },
                    { key: 'Support SLA', value: 'Email Support Included (support@store.prontly.in)' },
                  ].map((row, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 px-5 py-3 hover:bg-zinc-50/50 transition-colors">
                      <span className="font-semibold text-zinc-500 font-mono text-[11px]">{row.key}</span>
                      <span className="sm:col-span-2 font-medium text-zinc-900 break-all">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* What's in the Archive */}
              <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-2xs space-y-3">
                <h3 className="!font-sans text-sm font-extrabold text-zinc-950 tracking-tight flex items-center gap-2">
                  <FolderCheck className="h-4 w-4 text-blue-600" /> What is included inside the package:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                    <FileCode className="h-3.5 w-3.5 text-zinc-700 shrink-0" />
                    <span className="font-medium text-zinc-800">Production Source Assets & Code</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                    <FileText className="h-3.5 w-3.5 text-zinc-700 shrink-0" />
                    <span className="font-medium text-zinc-800">Quickstart Setup & Integration Guide</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                    <Award className="h-3.5 w-3.5 text-zinc-700 shrink-0" />
                    <span className="font-medium text-zinc-800">Commercial License Agreement PDF</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                    <Clock className="h-3.5 w-3.5 text-zinc-700 shrink-0" />
                    <span className="font-medium text-zinc-800">Lifetime Vault Access for Future Updates</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: COMMERCIAL LICENSE */}
          {activeTab === 'license' && (
            <div className="mt-6 max-w-4xl space-y-6 animate-in fade-in duration-300">
              
              <div className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 shadow-2xs space-y-5">
                <div>
                  <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 mb-1.5 font-mono">
                    Perpetual Commercial Rights
                  </Badge>
                  <h3 className="!font-sans text-lg sm:text-xl font-extrabold text-zinc-950 tracking-tight">
                    Clear, Transparent Commercial Rights
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    When you purchase on Prontly Store, you receive an unrestricted commercial license to build, launch, and monetize.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Allowed Column */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>What You CAN Do:</span>
                    </div>
                    <ul className="space-y-2 text-xs text-zinc-700">
                      <li className="flex items-start gap-1.5">
                        <Check className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Deploy into unlimited personal, startup, and commercial client projects.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Integrate into monetized SaaS applications, mobile apps, or digital deliverables.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Modify, refactor, customize, or combine with other code and tools.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Charge your own clients for final products and services created using this asset.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Restricted Column */}
                  <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                      <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                      <span>What You CANNOT Do:</span>
                    </div>
                    <ul className="space-y-2 text-xs text-zinc-700">
                      <li className="flex items-start gap-1.5">
                        <X className="h-3 w-3 text-rose-600 shrink-0 mt-0.5" />
                        <span>Resell, sub-license, or redistribute raw source files as a competing digital asset.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <X className="h-3 w-3 text-rose-600 shrink-0 mt-0.5" />
                        <span>Publish raw assets in open public repositories (e.g. public GitHub repos or torrents).</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <X className="h-3 w-3 text-rose-600 shrink-0 mt-0.5" />
                        <span>Claim original authorship of the standalone base tool without meaningful modification.</span>
                      </li>
                    </ul>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 4: CREATOR REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="mt-6 max-w-4xl space-y-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl border border-zinc-200 p-5 sm:p-6 shadow-2xs">
                <ReviewSystem productId={product.id} productName={product.name} />
              </div>
            </div>
          )}

        </section>

        {/* ── 5. FREQUENTLY ASKED QUESTIONS (FAQ) ──────────────── */}
        <section className="mt-12 pt-8 border-t border-zinc-200">
          <div className="max-w-3xl space-y-4">
            <div>
              <h2 className="!font-sans text-xl sm:text-2xl font-extrabold text-zinc-950 tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Everything you need to know about purchasing, commercial licensing, and instant file access.
              </p>
            </div>

            <div className="space-y-2.5">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl border border-zinc-200 overflow-hidden transition-all shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 font-bold text-xs sm:text-sm text-zinc-900 hover:text-blue-600 transition-colors"
                    >
                      <span className="font-sans">{faq.q}</span>
                      {isOpen ? <ChevronUp className="h-3.5 w-3.5 shrink-0 text-zinc-400" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-xs text-zinc-600 leading-relaxed border-t border-zinc-100 pt-2.5">
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
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-zinc-200 p-2.5 sm:hidden shadow-xl flex items-center justify-between gap-2.5 animate-in slide-in-from-bottom duration-300">
          <div className="min-w-0">
            <p className="text-xs font-bold text-zinc-950 truncate font-sans">{product.name}</p>
            <p className="text-sm font-extrabold text-zinc-950 font-mono">
              ₹{totalInRupees.toLocaleString('en-IN')}
            </p>
          </div>
          <Button
            size="sm"
            onClick={scrollToCheckout}
            className="h-9 px-4 rounded-lg font-bold bg-zinc-950 text-white shrink-0 shadow-xs font-sans text-xs"
          >
            ⚡ Buy Now
          </Button>
        </div>
      )}

      {/* ── 7. FOOTER ─────────────────────────────────────────── */}
      <footer className="mt-16 border-t border-zinc-200 bg-white py-8 px-4 text-center text-xs text-zinc-500 space-y-2">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <div className="relative h-5 w-5 rounded-md overflow-hidden border border-zinc-200">
            <Image 
              src="https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png" 
              alt="Prontly Logo" 
              fill 
              sizes="20px"
              className="object-cover" 
            />
          </div>
          <span className="font-extrabold text-zinc-900 tracking-tight font-sans text-xs">
            Prontly Store
          </span>
        </div>
        <p className="text-[11px] text-zinc-500">
          © {new Date().getFullYear()} Prontly Technologies — Verified Digital Assets for Modern Creators.
        </p>
        <p className="text-[10px] text-zinc-400 max-w-md mx-auto">
          Assistance or custom queries: <a href="mailto:support@store.prontly.in" className="text-blue-600 underline font-semibold">support@store.prontly.in</a>.
        </p>
      </footer>

    </div>
  );
}
