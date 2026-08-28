import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductGrid } from '@/components/store/ProductGrid';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Globe,
  Cpu,
  Star,
  Package,
  Clock,
  CheckCircle2,
  Quote,
  Users,
  TrendingUp,
  Award,
  ChevronRight,
  Search,
  Play,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { firebaseConfig } from '@/firebase/config';
import { RecentPurchasePopup } from '@/components/store/RecentPurchasePopup';
import { isDatabaseConfigured, getDb } from '@/lib/db';
import { products as productsTable, categories as categoriesTable } from '@/lib/db/schema';

async function getHomeData() {
  if (isDatabaseConfigured()) {
    try {
      const db = getDb();
      const [cats, prods] = await Promise.all([
        db.select().from(categoriesTable),
        db.select().from(productsTable),
      ]);
      return {
        categories: cats.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug, iconEmoji: c.iconEmoji || '📦' })),
        products: prods.map((p: any) => ({
          id: p.id, slug: p.slug, name: p.name, price: p.price,
          compareAtPrice: p.compareAtPrice || 0, categorySlug: p.categorySlug || 'asset',
          images: Array.isArray(p.images) ? p.images : [],
          averageRating: (p.averageRating ?? 50) / 10, salesCount: p.salesCount || 0,
          shortDescription: p.shortDescription || '',
          isPublished: p.isPublished ?? true, isFeatured: p.isFeatured || false,
        })),
      };
    } catch (e) { console.error('[HOMEPAGE_SQL_ERROR]:', e); }
  }

  const projectId = firebaseConfig.projectId;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  try {
    const [catRes, prodRes] = await Promise.all([
      fetch(`${baseUrl}/categories`, { next: { revalidate: 3600 } }),
      fetch(`${baseUrl}/products?pageSize=100`, { next: { revalidate: 60 } }),
    ]);
    const catData = await catRes.json();
    const prodData = await prodRes.json();
    const categories = (catData.documents || []).map((doc: any) => ({
      id: doc.name.split('/').pop(), name: doc.fields?.name?.stringValue || '',
      slug: doc.fields?.slug?.stringValue || '', iconEmoji: doc.fields?.iconEmoji?.stringValue || '📦',
    }));
    const products = (prodData.documents || []).map((doc: any) => {
      const f = doc.fields || {};
      return {
        id: doc.name.split('/').pop(), slug: f.slug?.stringValue || '', name: f.name?.stringValue || 'Untitled',
        price: parseInt(f.price?.integerValue || '0'), compareAtPrice: parseInt(f.compareAtPrice?.integerValue || '0'),
        categorySlug: f.categorySlug?.stringValue || 'asset',
        images: f.images?.arrayValue?.values?.map((v: any) => v.stringValue) || [],
        averageRating: parseFloat(f.averageRating?.doubleValue || '5'), salesCount: parseInt(f.salesCount?.integerValue || '0'),
        shortDescription: f.shortDescription?.stringValue || '', isPublished: f.isPublished?.booleanValue ?? true, isFeatured: false,
      };
    });
    return { categories, products };
  } catch { return { categories: [], products: [] }; }
}

export default async function Home() {
  const { categories, products } = await getHomeData();
  const published = products.filter((p: any) => p.isPublished !== false);
  const trending = [...published].sort((a: any, b: any) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, 8);
  const featured = published.filter((p: any) => p.isFeatured).slice(0, 4);
  const displayProducts = featured.length >= 3 ? featured : trending.slice(0, 4);
  const stats = {
    downloads: published.reduce((s: number, p: any) => s + (p.salesCount || 0), 0) || 5200,
    count: published.length,
    rating: published.length > 0 ? (published.reduce((s: any, p: any) => s + (p.averageRating || 5), 0) / published.length).toFixed(1) : '4.9',
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-accent/20 selection:text-accent">
      <Navbar />
      <main className="flex-1 w-full max-w-[100vw] overflow-hidden">

        {/* ── HERO SECTION ─────────────────────────────── */}
        <section className="relative pt-24 pb-14 md:pt-32 md:pb-20 overflow-hidden">
          {/* Ambient Lighting Background */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.03] via-violet-500/[0.02] to-transparent" />
            <div className="absolute -top-40 right-[-10%] h-[650px] w-[650px] rounded-full bg-amber-500/[0.05] blur-[140px]" />
            <div className="absolute top-1/3 -left-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/[0.04] blur-[120px]" />
            <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
          </div>

          <div className="container-page relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
              
              {/* Left Column: Headline & Call To Actions */}
              <div className="lg:col-span-7 flex flex-col gap-5 sm:gap-6 min-w-0">
                
                {/* Social Proof Live Pill */}
                <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/90 border border-border/80 shadow-xs px-3.5 py-1.5 backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-semibold text-foreground/80">Trusted by many creators</span>
                  <span className="h-3 w-px bg-border/80 mx-0.5" />
                  <span className="flex items-center gap-1 text-xs font-bold text-foreground">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {stats.rating}/5
                  </span>
                </div>

                {/* Main Headline */}
                <h1 className="text-display-lg tracking-tight text-foreground text-pretty">
                  Digital assets<br className="hidden sm:inline" />
                  {' '}that help you{' '}
                  <span className="relative inline-block whitespace-nowrap">
                    <span className="relative z-10 bg-gradient-to-r from-amber-800 via-amber-600 to-amber-700 bg-clip-text text-transparent">
                      ship 10x faster
                    </span>
                    <span className="absolute bottom-1.5 left-0 right-0 h-2.5 bg-amber-200/50 -rotate-1 rounded-sm -z-0" />
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-[54ch] leading-relaxed text-pretty font-normal">
                  Production-ready AI prompts, UI design systems, code snippets, and automated workflows. Verified by experts, delivered instantly with a lifetime commercial license.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button asChild size="lg" className="rounded-2xl h-12 px-7 text-sm font-semibold shadow-md bg-zinc-950 text-white hover:bg-zinc-800 group active:scale-[0.98] transition-all">
                    <Link href="/products" className="flex items-center gap-2">
                      Explore catalog
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-2xl h-12 px-6 text-sm font-medium bg-white/80 backdrop-blur hover:bg-white border-border/80 shadow-xs active:scale-[0.98] transition-all">
                    <Link href="#how-it-works" className="flex items-center gap-2">
                      <Play className="h-3.5 w-3.5 fill-current opacity-70" /> How it works
                    </Link>
                  </Button>
                </div>

                {/* Trust Badges & Metrics */}
                <div className="flex flex-wrap items-center gap-y-3 gap-x-5 pt-5 mt-1 border-t border-border/50">
                  <div className="flex items-center gap-2.5">
                    <div className="flex -space-x-2">
                      {[11, 32, 15, 27, 44].map((imgId) => (
                        <div key={`avatar-${imgId}`} className="h-7 w-7 rounded-full border-2 border-white bg-muted flex items-center justify-center overflow-hidden shadow-xs">
                          <Image src={`https://i.pravatar.cc/100?img=${imgId}`} alt="Creator" width={28} height={28} className="object-cover" unoptimized />
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      <strong className="font-bold text-foreground">{stats.downloads.toLocaleString('en-IN')}+</strong> downloads
                    </span>
                  </div>

                  <span className="h-4 w-px bg-border/60 hidden sm:block" />

                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" /> Secure Checkout
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Zap className="h-4 w-4 text-amber-500" /> Instant Delivery
                  </span>
                </div>
              </div>

              {/* Right Column: Hero Visual Showcase */}
              <div className="lg:col-span-5 min-w-0">
                <div className="relative mx-auto w-full max-w-[420px] h-[340px] sm:h-[400px]">
                  {/* Glow Backdrop */}
                  <div className="absolute -inset-4 bg-gradient-to-tr from-amber-500/15 via-violet-500/10 to-transparent rounded-[2.5rem] blur-2xl -z-10" />
                  
                  {displayProducts.length > 0 ? (
                    <div className="relative h-full w-full">
                      {/* Main Featured Showcase Card */}
                      <div className="absolute inset-0 rounded-3xl overflow-hidden border border-border/80 bg-white shadow-xl flex flex-col justify-end group cursor-pointer transition-all duration-300 hover:shadow-2xl">
                        <Link href={`/products/${displayProducts[0]?.slug || displayProducts[0]?.id}`} className="absolute inset-0">
                          <Image 
                            src={displayProducts[0]?.images?.[0] || 'https://picsum.photos/seed/hero/800/600'} 
                            alt={displayProducts[0]?.name || 'Featured Product'} 
                            fill 
                            className="object-cover transition-transform duration-700 group-hover:scale-105" 
                            sizes="(max-width: 1024px) 100vw, 420px" 
                            priority 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/30 to-transparent" />
                          
                          {/* Top pill */}
                          <div className="absolute top-3.5 left-3.5 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-3 py-1 shadow-sm">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold tracking-wider text-zinc-900 uppercase">
                              TOP PICK
                            </span>
                          </div>

                          {/* Bottom info */}
                          <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 text-white">
                            <div className="flex items-end justify-between gap-3">
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                                  {displayProducts[0]?.categorySlug || 'Asset'}
                                </span>
                                <p className="text-white text-base sm:text-lg font-bold leading-tight line-clamp-1 mt-0.5">
                                  {displayProducts[0]?.name}
                                </p>
                                <p className="text-white/80 text-xs mt-1 flex items-center gap-1.5">
                                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                  <span className="font-semibold">{displayProducts[0]?.averageRating?.toFixed(1) || '5.0'}</span>
                                  <span>•</span>
                                  <span>{displayProducts[0]?.salesCount || 120} sales</span>
                                </p>
                              </div>
                              <span className="shrink-0 rounded-xl bg-white text-zinc-950 text-xs sm:text-sm font-extrabold px-3.5 py-2 shadow-md">
                                ₹{((displayProducts[0]?.price || 0) / 100).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </Link>
                      </div>

                      {/* Floating Accent Card 1 (Desktop) */}
                      {displayProducts[1] && (
                        <div className="absolute -bottom-5 -left-8 w-[140px] aspect-square rounded-2xl overflow-hidden border-2 border-white bg-white shadow-xl rotate-[-3deg] hidden xl:block hover:rotate-0 transition-transform duration-300">
                          <Image src={displayProducts[1]?.images?.[0] || ''} alt="" fill className="object-cover" sizes="140px" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                            <span className="text-[10px] font-bold text-white line-clamp-1">{displayProducts[1]?.name}</span>
                          </div>
                        </div>
                      )}

                      {/* Floating Accent Card 2 (Desktop) */}
                      {displayProducts[2] && (
                        <div className="absolute -top-4 -right-6 w-[110px] aspect-[4/3] rounded-2xl overflow-hidden border-2 border-white bg-white shadow-lg rotate-[3deg] hidden xl:block hover:rotate-0 transition-transform duration-300">
                          <Image src={displayProducts[2]?.images?.[0] || ''} alt="" fill className="object-cover" sizes="110px" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border/80 rounded-3xl bg-muted/20">
                      <Package className="h-10 w-10 text-muted-foreground/30" />
                      <span className="text-xs text-muted-foreground font-semibold">Catalog updating…</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Ecosystem Compatibility Row */}
            <div className="mt-12 md:mt-16 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-6 text-xs text-muted-foreground border-t border-border/50 pt-7">
              <span className="font-semibold text-muted-foreground/80">Engineered for your stack:</span>
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-semibold text-foreground/80">
                <span className="inline-flex items-center gap-1.5"><Layers className="h-4 w-4 text-accent" /> Notion</span>
                <span className="inline-flex items-center gap-1.5"><Cpu className="h-4 w-4 text-violet-600" /> Claude & OpenAI</span>
                <span className="inline-flex items-center gap-1.5"><Zap className="h-4 w-4 text-amber-500" /> Make & Zapier</span>
                <span className="inline-flex items-center gap-1.5"><Globe className="h-4 w-4 text-blue-500" /> Next.js & React</span>
              </div>
            </div>

          </div>
        </section>

        {/* ── CATEGORIES ───────────────────────── */}
        {categories.length > 0 && (
          <section className="py-12 bg-muted/25 border-y border-border/50 overflow-hidden">
            <div className="container-page">
              <div className="flex items-end justify-between gap-4 mb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold text-accent mb-1.5">
                    CATEGORIES
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    Browse by Category
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Targeted toolkits, prompts, and frameworks designed for specific workflows
                  </p>
                </div>
                <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex text-accent hover:text-accent font-semibold text-xs h-8 -mr-2">
                  <Link href="/products" className="inline-flex items-center gap-1">
                    View all <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              {/* Responsive Category Grid & Scroll */}
              <div className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 overflow-x-auto pb-3 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar snap-x snap-mandatory">
                {categories.map((cat: any) => {
                  const count = products.filter((p: any) => p.categorySlug === cat.slug).length;
                  return (
                    <Link 
                      key={cat.id} 
                      href={`/products?category=${cat.slug}`} 
                      className="shrink-0 w-[150px] sm:w-auto snap-start group"
                    >
                      <div className="h-full bg-white border border-border/70 rounded-2xl p-4 flex flex-col items-center gap-2.5 text-center transition-all duration-300 hover:border-accent/40 hover:shadow-md hover:-translate-y-1">
                        <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center group-hover:scale-110 group-hover:bg-accent/10 transition-all duration-300">
                          <span className="text-2xl leading-none">{cat.iconEmoji || '📦'}</span>
                        </div>
                        <div className="min-w-0 w-full">
                          <p className="font-semibold text-xs sm:text-sm leading-tight line-clamp-1 group-hover:text-accent transition-colors">
                            {cat.name}
                          </p>
                          <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                            {count} {count === 1 ? 'asset' : 'assets'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── TRENDING PRODUCTS ────────────────── */}
        {trending.length > 0 && (
          <section className="py-14 md:py-20 overflow-hidden">
            <div className="container-page">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 mb-2">
                    <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
                    <span className="text-[10px] font-bold tracking-wide text-amber-700 uppercase">TRENDING ASSETS</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    Most Popular This Week
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Top-rated prompts, UI components, and automation templates chosen by creators
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex rounded-xl h-9 px-4 text-xs font-semibold border-border/80 hover:bg-muted">
                  <Link href="/products" className="inline-flex items-center gap-1.5">
                    Browse all assets <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>

              {/* Grid of trending products */}
              <ProductGrid products={trending} />

              <div className="sm:hidden mt-8 text-center">
                <Button variant="outline" size="lg" asChild className="rounded-xl w-full h-11 text-xs font-semibold">
                  <Link href="/products" className="flex items-center justify-center gap-2">
                    View complete catalog <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* ── HOW IT WORKS ────────────────────── */}
        <section id="how-it-works" className="py-14 md:py-20 bg-muted/20 border-y border-border/50">
          <div className="container-page">
            <div className="text-center max-w-xl mx-auto mb-12">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold text-accent mb-2 uppercase">
                SIMPLE WORKFLOW
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                How Prontly Works
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                From finding the exact tool to running it in production within 60 seconds
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  step: '01',
                  title: 'Discover & Inspect',
                  desc: 'Search our curated catalog of tested prompts, design systems, and automations with live previews and documentation.',
                  icon: Search,
                  color: 'text-amber-600 bg-amber-500/10'
                },
                {
                  step: '02',
                  title: 'One-Click Checkout',
                  desc: 'Pay once securely via Razorpay (Cards, UPI, NetBanking). No recurring charges, subscriptions, or hidden fees.',
                  icon: ShieldCheck,
                  color: 'text-blue-600 bg-blue-500/10'
                },
                {
                  step: '03',
                  title: 'Deploy & Lifetime Updates',
                  desc: 'Download your files instantly with high-speed Cloudflare R2 links. Access all future version updates forever.',
                  icon: Zap,
                  color: 'text-emerald-600 bg-emerald-500/10'
                },
              ].map((item) => (
                <div key={item.step} className="relative rounded-2xl border border-border/80 bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between group hover:border-accent/40 hover:shadow-md transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-3xl sm:text-4xl font-extrabold font-headline text-border group-hover:text-accent transition-colors">
                        {item.step}
                      </span>
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${item.color}`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="font-bold text-base sm:text-lg text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES & VALUE PROPOSITION ────── */}
        <section className="py-14 md:py-20">
          <div className="container-page">
            <div className="max-w-2xl mb-10">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold text-accent mb-2 uppercase">
                WHY PRONTLY
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Built for High-Output Creators
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                Everything in the marketplace is designed to eliminate repetitive setup time and deliver production-grade results.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { title: 'Instant Cloud Delivery', desc: 'Secure download links generated in real-time via Cloudflare R2 infrastructure.', icon: Zap, color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
                { title: 'Production Tested', desc: 'Every prompt and template is rigorously tested across real-world workloads before approval.', icon: Cpu, color: 'text-violet-600 bg-violet-500/10 border-violet-500/20' },
                { title: 'Lifetime Free Updates', desc: 'Receive new revisions and AI model compatibility updates at zero additional charge.', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
                { title: 'Secure Razorpay Payments', desc: 'PCI-DSS compliant payments with instant receipt and verified order confirmation.', icon: ShieldCheck, color: 'text-blue-600 bg-blue-500/10 border-blue-500/20' },
                { title: 'Perpetual Commercial License', desc: 'Use assets in unlimited personal, client, or commercial business projects without royalties.', icon: Award, color: 'text-cyan-600 bg-cyan-500/10 border-cyan-500/20' },
                { title: '30-Day Guarantee', desc: 'Complete peace of mind. If any asset fails to perform as described, get a full refund.', icon: Sparkles, color: 'text-orange-600 bg-orange-500/10 border-orange-500/20' },
              ].map((feat) => (
                <div key={feat.title} className="rounded-2xl border border-border/80 bg-white p-5 sm:p-6 flex gap-4 hover:border-accent/40 hover:shadow-md transition-all">
                  <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${feat.color}`}>
                    <feat.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ─────────────────────── */}
        <section className="py-14 md:py-20 bg-white border-y border-border/50 overflow-hidden">
          <div className="container-page">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 mb-1.5 uppercase">
                  COMMUNITY LOVE
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  Loved by Engineers & Creators
                </h2>
              </div>
              <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-foreground/80">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> 4.9/5 from 300+ reviews
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  quote: '“The Claude engineering prompts reduced my sprint research and documentation time by nearly 70%. Absolute game changer.”',
                  name: 'Aarav Sharma',
                  role: 'Lead Architect @ BuildFast',
                  avatar: 'https://i.pravatar.cc/100?img=11'
                },
                {
                  quote: '“Prontly templates are the only ones I’ve bought that genuinely worked in production out of the box without rewrites.”',
                  name: 'Priya Mukherjee',
                  role: 'Fullstack Dev & Creator',
                  avatar: 'https://i.pravatar.cc/100?img=32'
                },
                {
                  quote: '“The one-time payment with perpetual updates is the best model. Downloaded once and already saved dozens of development hours.”',
                  name: 'Rohan Kapoor',
                  role: 'Indie Hacker & Founder',
                  avatar: 'https://i.pravatar.cc/100?img=15'
                },
              ].map((item) => (
                <div key={item.name} className="rounded-2xl border border-border/80 bg-card p-6 flex flex-col justify-between gap-4 hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <Quote className="h-5 w-5 text-accent/40" />
                    <p className="text-xs sm:text-sm leading-relaxed text-foreground font-medium">
                      {item.quote}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-3 border-t border-border/50">
                    <Image src={item.avatar} alt={item.name} width={36} height={36} className="rounded-full object-cover border" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold leading-none text-foreground">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.role}</p>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ SECTION ──────────────────────── */}
        <section className="py-14 md:py-20">
          <div className="container-page max-w-3xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold text-accent mb-2 uppercase">
                FREQUENTLY ASKED
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Got Questions?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Everything you need to know about purchasing and using assets from Prontly.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { q: 'Is there any monthly subscription fee?', a: 'No. All items on Prontly are one-time purchases with perpetual lifetime access and free updates.' },
                { q: 'How and when do I get my download links?', a: 'Immediately after completing payment via Razorpay, your download links are ready on the success page and always accessible in your Dashboard → Downloads.' },
                { q: 'Can I use these assets for client and commercial projects?', a: 'Yes. Every asset includes a full perpetual commercial license for unlimited personal and client projects.' },
                { q: 'What is your refund policy?', a: 'We offer a 30-day satisfaction money-back guarantee. If a product does not match its description or deliver value, reach out to our team for a fast refund.' },
                { q: 'How do lifetime updates work?', a: 'Whenever a creator updates prompt packs, templates, or code to newer model versions, you get access to the latest downloads directly in your dashboard.' },
              ].map((item) => (
                <details key={item.q} className="group rounded-2xl border border-border/80 bg-white px-5 py-4 open:border-accent/40 open:shadow-xs transition-all">
                  <summary className="flex items-center justify-between cursor-pointer list-none text-xs sm:text-sm font-semibold text-foreground">
                    <span>{item.q}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-open:rotate-90 shrink-0 ml-2" />
                  </summary>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-3 leading-relaxed pr-6 border-t border-border/40 pt-3">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CALL TO ACTION ─────────────── */}
        <section className="pb-16 md:pb-20">
          <div className="container-page">
            <div className="rounded-3xl bg-zinc-950 text-white px-6 py-12 md:px-12 md:py-16 text-center relative overflow-hidden shadow-2xl border border-zinc-800">
              {/* Radial Accent Lighting */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(245,158,11,0.18),transparent_60%)] pointer-events-none" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none" aria-hidden />

              <div className="relative z-10 max-w-[560px] mx-auto flex flex-col items-center gap-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-semibold tracking-wide text-white/90 backdrop-blur-md">
                  <Clock className="h-3.5 w-3.5 text-amber-400" /> Start building in under 2 minutes
                </span>
                
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight text-pretty font-headline">
                  Ready to accelerate your workflow?
                </h2>
                
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-[46ch] text-pretty">
                  Join thousands of developers and creators using verified assets to launch faster. One purchase, lifetime access.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Button asChild size="lg" className="bg-white text-zinc-950 hover:bg-zinc-100 h-12 px-7 text-sm font-bold rounded-2xl shadow-lg active:scale-[0.98] transition-all">
                    <Link href="/products" className="inline-flex items-center gap-2">
                      Browse Full Catalog <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-2xl h-12 px-6 text-sm font-medium bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white active:scale-[0.98] transition-all">
                    <Link href="/blog">Read Tutorials & Blog</Link>
                  </Button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-zinc-400 pt-2">
                  <span>⚡ Instant Fulfillment</span>
                  <span>•</span>
                  <span>🛡️ 30-Day Money-Back</span>
                  <span>•</span>
                  <span>💳 PCI-DSS Compliant</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      <RecentPurchasePopup />
      <Footer />
    </div>
  );
}
