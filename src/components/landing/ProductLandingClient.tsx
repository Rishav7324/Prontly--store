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
  FileText,
  AlertCircle,
  FolderCheck,
  HardDrive,
  Cpu,
  Globe,
  Terminal,
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
import { ReviewSystem } from '@/components/store/ReviewSystem';

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
  const tabsSectionRef = useRef<HTMLDivElement>(null);
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

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Complete Source Archive';
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-18 flex items-center justify-between">
          
          {/* Official Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-xl overflow-hidden shadow-sm border border-zinc-200/80 transition-transform duration-300 group-hover:scale-105 bg-white">
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
          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-100/90 text-zinc-700 font-semibold border border-zinc-200 text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Verified Creator Asset</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/80 text-[11px]">
              <Lock className="h-3 w-3 text-emerald-600" />
              <span>256-Bit SSL</span>
            </div>
            <a
              href="mailto:support@store.prontly.in?subject=Help%20with%20Product%20Purchase"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 text-white font-medium text-[11px] hover:bg-zinc-800 transition-colors shadow-xs"
            >
              <MessageSquare className="h-3 w-3" />
              <span>Support</span>
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        
        {/* Deal Badge */}
        <div className="mb-5 flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide shadow-2xs">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping" />
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            OFFICIAL RELEASE • SAVE {discountPercent}% TODAY
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            <Clock className="h-3.5 w-3.5 text-amber-500" /> Direct High-Speed Download
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ── LEFT COLUMN: PRODUCT MEDIA & HIGHLIGHTS ── */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Title & Reviews Header */}
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
                <p className="text-sm sm:text-base text-zinc-600 leading-relaxed pt-1 font-normal">
                  {product.shortDescription}
                </p>
              )}
            </div>

            {/* macOS Software Frame Mockup */}
            <div className="rounded-3xl border border-zinc-200/90 bg-white shadow-xl overflow-hidden ring-1 ring-zinc-950/5">
              
              {/* Sleek Window Control Bar */}
              <div className="bg-zinc-100/80 px-4 py-2.5 border-b border-zinc-200/70 flex items-center justify-between select-none">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56] inline-block border border-[#e0443e]/40 shadow-2xs" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e] inline-block border border-[#dea123]/40 shadow-2xs" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f] inline-block border border-[#1aab29]/40 shadow-2xs" />
                </div>
                
                <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-zinc-500 bg-white px-3 py-0.5 rounded-full border border-zinc-200/80 shadow-2xs truncate max-w-[200px] sm:max-w-xs">
                  <Lock className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                  <span className="truncate">store.prontly.in/p/{product.slug}</span>
                </div>

                <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider hidden sm:block">
                  v{product.fileVersion || '1.0'}
                </div>
              </div>

              {/* Main Preview Image */}
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-zinc-950 group">
                <Image
                  src={images[selectedImgIndex]}
                  alt={product.name}
                  fill
                  priority
                  className="object-cover transition-transform duration-500 group-hover:scale-101"
                />
                
                <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                  <Badge className="bg-zinc-950/90 backdrop-blur-md text-white font-bold text-xs px-3 py-1 rounded-xl shadow-xs uppercase tracking-wider">
                    {product.categorySlug || 'Digital Asset'}
                  </Badge>
                  {discountPercent > 0 && (
                    <Badge className="bg-emerald-600 text-white font-bold text-xs px-3 py-1 rounded-xl shadow-xs">
                      Save {discountPercent}%
                    </Badge>
                  )}
                </div>
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
                      "relative h-18 w-18 sm:h-20 sm:w-20 rounded-2xl overflow-hidden border-2 transition-all shrink-0 bg-white shadow-2xs",
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
                  What you get with your purchase
                </h3>
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 font-mono">
                  <Check className="h-3.5 w-3.5" /> Perpetual Ownership
                </span>
              </div>

              <ul className="space-y-3.5 text-xs sm:text-sm text-zinc-700">
                <li className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="h-3 w-3" />
                  </div>
                  <span><strong>Instant High-Speed Download:</strong> Unpack production-ready files via Cloudflare R2 edge network instantly after payment.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Award className="h-3 w-3" />
                  </div>
                  <span><strong>Perpetual Commercial License:</strong> Unlimited personal, agency, and commercial client deployment rights included.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                    <RefreshCw className="h-3 w-3" />
                  </div>
                  <span><strong>Free Lifetime Updates:</strong> Access future revisions, enhancements, and compatibility patches free forever in your vault.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                    <FileCode className="h-3 w-3" />
                  </div>
                  <span><strong>Full Source & Documentation:</strong> Clean code, step-by-step setup guides, and raw source assets ready to implement.</span>
                </li>
              </ul>
            </div>

            {/* Technical Metadata Spec Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'File Format', val: product.fileFormat || 'ZIP / Source', icon: FileCode },
                { label: 'Version', val: `v${product.fileVersion || '1.0'}`, icon: Zap },
                { label: 'License', val: 'Perpetual Commercial', icon: ShieldCheck },
                { label: 'File Size', val: formatFileSize(product.fileSize), icon: HardDrive },
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
                      <p className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 font-mono">
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
        <section className="mt-16 sm:mt-24 pt-10 border-t border-zinc-200" ref={tabsSectionRef}>
          
          {/* Tab Selection Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 border-b border-zinc-200 no-scrollbar">
            {[
              { id: 'overview', label: 'Overview & Documentation', icon: FileText },
              { id: 'specs', label: 'Architecture & Specs', icon: Cpu },
              { id: 'license', label: 'Commercial License', icon: Award },
              { id: 'reviews', label: `Verified Reviews (${Math.max(product.reviewCount || 0, 24)})`, icon: Star },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all select-none",
                    isActive
                      ? "bg-zinc-950 text-white shadow-md"
                      : "bg-white text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 border border-zinc-200/80"
                  )}
                >
                  <TabIcon className={cn("h-4 w-4", isActive ? "text-amber-400" : "text-zinc-400")} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW & DOCUMENTATION */}
          {activeTab === 'overview' && (
            <div className="mt-8 max-w-4xl space-y-8 animate-in fade-in duration-300">
              
              {/* Product Description */}
              {product.description ? (
                <div
                  className="landing-prose"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <div className="bg-white rounded-3xl border border-zinc-200 p-8 text-center space-y-3">
                  <FolderCheck className="h-10 w-10 text-emerald-600 mx-auto" />
                  <h3 className="text-lg font-bold text-zinc-900">Production Ready Asset</h3>
                  <p className="text-sm text-zinc-600 max-w-lg mx-auto">
                    This digital product includes complete source code, implementation guides, and assets verified by Prontly. Download immediately upon purchase.
                  </p>
                </div>
              )}

              {/* Core Feature Highlights Box */}
              <div className="mt-10 rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <h3 className="!font-sans text-base font-extrabold text-zinc-950 tracking-tight">
                    Key Implementation Features
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900">Production-Vetted Codebase</h4>
                      <p className="text-xs text-zinc-600 mt-0.5">Strict typing, modular architecture, and zero unnecessary runtime dependencies.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900">Perpetual Commercial Rights</h4>
                      <p className="text-xs text-zinc-600 mt-0.5">Deploy directly into commercial client projects, apps, and internal tooling.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900">Fast Cloudflare R2 Delivery</h4>
                      <p className="text-xs text-zinc-600 mt-0.5">Instant downloads served from the nearest edge CDN server worldwide.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900">Dedicated Creator Support</h4>
                      <p className="text-xs text-zinc-600 mt-0.5">Direct technical assistance from engineers if you hit any setup roadblocks.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: ARCHITECTURE & SPECS */}
          {activeTab === 'specs' && (
            <div className="mt-8 max-w-4xl space-y-8 animate-in fade-in duration-300">
              
              {/* Technical Specifications Table */}
              <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-xs">
                <div className="px-6 py-4.5 bg-zinc-50/80 border-b border-zinc-200/80 flex items-center justify-between">
                  <h3 className="!font-sans text-sm font-extrabold text-zinc-950 uppercase tracking-wider font-mono">
                    Technical Specification Breakdown
                  </h3>
                  <Badge variant="outline" className="border-zinc-300 text-zinc-700 font-mono text-xs">
                    Verified Manifest
                  </Badge>
                </div>

                <div className="divide-y divide-zinc-100 text-xs sm:text-sm">
                  {[
                    { key: 'Product Identifier', value: product.id },
                    { key: 'Category & Domain', value: product.categorySlug || 'Digital Software & Tools' },
                    { key: 'Distribution Format', value: product.fileFormat || 'ZIP Archive (Full Source)' },
                    { key: 'Current Release Version', value: `v${product.fileVersion || '1.0.0'}` },
                    { key: 'Uncompressed Package Size', value: formatFileSize(product.fileSize) },
                    { key: 'Licensing Model', value: 'Perpetual Commercial Royalty-Free' },
                    { key: 'Download Delivery Host', value: 'Cloudflare R2 Global Edge Network' },
                    { key: 'Support SLA', value: 'Email Support Included (support@store.prontly.in)' },
                  ].map((row, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-3 px-6 py-3.5 hover:bg-zinc-50/50 transition-colors">
                      <span className="font-semibold text-zinc-500 font-mono text-xs">{row.key}</span>
                      <span className="sm:col-span-2 font-medium text-zinc-900 break-all">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* What's in the Archive */}
              <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-4">
                <h3 className="!font-sans text-base font-extrabold text-zinc-950 tracking-tight flex items-center gap-2">
                  <FolderCheck className="h-5 w-5 text-blue-600" /> What is included inside the package:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                    <FileCode className="h-4 w-4 text-zinc-700 shrink-0" />
                    <span className="font-medium text-zinc-800">Production Source Assets & Code</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                    <FileText className="h-4 w-4 text-zinc-700 shrink-0" />
                    <span className="font-medium text-zinc-800">Quickstart Setup & Implementation Guide</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                    <Award className="h-4 w-4 text-zinc-700 shrink-0" />
                    <span className="font-medium text-zinc-800">Commercial License Agreement PDF</span>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                    <Clock className="h-4 w-4 text-zinc-700 shrink-0" />
                    <span className="font-medium text-zinc-800">Lifetime Vault Access for Future Updates</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: COMMERCIAL LICENSE */}
          {activeTab === 'license' && (
            <div className="mt-8 max-w-4xl space-y-8 animate-in fade-in duration-300">
              
              <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-3 py-1 mb-2 font-mono">
                    Perpetual Commercial Rights
                  </Badge>
                  <h3 className="!font-sans text-xl sm:text-2xl font-extrabold text-zinc-950 tracking-tight">
                    Clear, Transparent Commercial Rights
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                    When you purchase on Prontly Store, you receive an unrestricted commercial license to build, launch, and monetize.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  
                  {/* Allowed Column */}
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>What You CAN Do:</span>
                    </div>
                    <ul className="space-y-2.5 text-xs text-zinc-700">
                      <li className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Deploy into unlimited personal, startup, and commercial client projects.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Integrate into monetized SaaS applications, mobile apps, or digital deliverables.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Modify, refactor, customize, or combine with other code and tools.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Charge your own clients for final products and services created using this asset.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Restricted Column */}
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 space-y-3">
                    <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                      <AlertCircle className="h-4 w-4 text-rose-600" />
                      <span>What You CANNOT Do:</span>
                    </div>
                    <ul className="space-y-2.5 text-xs text-zinc-700">
                      <li className="flex items-start gap-2">
                        <X className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <span>Resell, sub-license, or redistribute raw uncompiled source files as a competing digital asset.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <X className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <span>Publish raw assets in open public repositories (e.g. public GitHub repos or torrent sites).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <X className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
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
            <div className="mt-8 max-w-4xl space-y-8 animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl border border-zinc-200 p-6 sm:p-8 shadow-xs">
                <ReviewSystem productId={product.id} productName={product.name} />
              </div>
            </div>
          )}

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
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-zinc-200 p-3 sm:hidden shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
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
