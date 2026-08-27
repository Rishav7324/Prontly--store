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
  const trending = [...published].sort((a: any, b: any) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, 4);
  const stats = {
    downloads: published.reduce((s: number, p: any) => s + (p.salesCount || 0), 0) || 5000,
    count: published.length,
    rating: published.length > 0 ? (published.reduce((s: any, p: any) => s + (p.averageRating || 5), 0) / published.length).toFixed(1) : '5.0',
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 w-full max-w-[100vw] overflow-hidden">

        {/* ── HERO ─────────────────────────────── */}
        <section className="relative pt-16 pb-8 md:pt-24 md:pb-10 overflow-hidden">
          {/* subtle premium backdrop */}
          <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
            <div className="absolute -top-24 right-[-8%] h-[420px] w-[520px] rounded-full bg-accent/[0.04] blur-[80px]" />
            <div className="absolute top-32 left-[-10%] h-[300px] w-[360px] rounded-full bg-zinc-900/[0.03] blur-[60px]" />
          </div>

          <div className="container-page relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              {/* left copy */}
              <div className="lg:col-span-7 flex flex-col gap-4 min-w-0">
                <span className="inline-flex w-fit items-center gap-1.5 text-[11px] font-medium tracking-wide text-accent bg-accent/[0.07] border border-accent/10 rounded-full px-2.5 py-1">
                  <Sparkles className="h-3 w-3 shrink-0" /> Premium Digital Assets
                </span>

                <h1 className="text-display-lg tracking-tight leading-[1.05] max-w-[22ch] text-pretty">
                  Scale your creative <span className="text-accent">workflow</span> with verified tools
                </h1>

                <p className="text-sm text-muted-foreground max-w-[50ch] leading-relaxed">
                  Professionally crafted prompts, automation systems, and business-ready digital assets.
                </p>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <Button asChild className="rounded-full h-9 px-5 text-sm font-semibold shadow-none group">
                    <Link href="/products" className="flex items-center gap-1.5">
                      Explore
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full h-9 px-5 text-sm font-medium bg-white hover:bg-muted/50 border-border/70">
                    <Link href="/products?view=categories">Categories</Link>
                  </Button>
                </div>

                {/* compact stats strip */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-4 mt-1 border-t border-border/60 max-w-full">
                  {[
                    [`${stats.downloads.toLocaleString('en-IN')}+`, 'Downloads'],
                    [`${stats.count}`, 'Assets'],
                    [`${stats.rating}★`, 'Rating'],
                    ['Instant', 'Access'],
                  ].map(([v, l]) => (
                    <div key={l} className="flex items-baseline gap-1">
                      <span className="text-sm font-semibold tracking-tight">{v}</span>
                      <span className="text-[11px] text-muted-foreground font-medium">{l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* right visual — subtle floating cards */}
              <div className="lg:col-span-5 hidden lg:block min-w-0">
                <div className="relative mx-auto w-full max-w-[360px] h-[340px] rounded-2xl overflow-visible">
                  {trending.length > 0 ? (
                    <>
                      {/* main card — clean, no heavy shadow */}
                      <div className="absolute inset-0 rounded-2xl overflow-hidden border border-border/60 bg-muted/20">
                        <Image
                          src={trending[0]?.images?.[0] || ''}
                          alt={trending[0]?.name || ''}
                          fill
                          className="object-cover"
                          sizes="360px"
                          priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 via-zinc-900/5 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3.5 flex items-end justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-white text-[13px] font-semibold leading-tight line-clamp-1">{trending[0]?.name}</p>
                            <p className="text-white/70 text-[11px] mt-0.5 flex items-center gap-1">
                              <Star className="h-3 w-3 fill-white/90 text-white/90" />
                              {trending[0]?.averageRating?.toFixed?.(1) ?? '5.0'} · {trending[0]?.salesCount ?? 0} sales
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-white text-zinc-900 text-xs font-semibold px-2.5 py-1">
                            ₹{((trending[0]?.price || 0) / 100).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* secondary floating — smaller, subtle rotation + soft shadow */}
                      {trending[1] && (
                        <div className="absolute -bottom-2 -left-4 w-[112px] aspect-square rounded-xl overflow-hidden border border-white/80 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] rotate-[-1.5deg] transition-transform duration-300 hover:rotate-0 hover:-translate-y-0.5 hidden xl:block">
                          <Image src={trending[1]?.images?.[0] || ''} alt="" fill className="object-cover" sizes="112px" />
                        </div>
                      )}

                      {/* tertiary accent — even smaller, minimal lift */}
                      {trending[2] && (
                        <div className="absolute -top-2 -right-3 w-[84px] aspect-[4/3] rounded-xl overflow-hidden border border-white/80 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.05)] rotate-[1.5deg] transition-transform duration-300 hover:rotate-0 hover:-translate-y-0.5 hidden xl:block">
                          <Image src={trending[2]?.images?.[0] || ''} alt="" fill className="object-cover" sizes="84px" />
                          <div className="absolute inset-0 ring-1 ring-black/[0.04] rounded-xl pointer-events-none" />
                        </div>
                      )}

                      {/* subtle live badge */}
                      <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur px-2.5 py-1 border border-black/5 shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-semibold tracking-wide text-zinc-700">LIVE CATALOG</span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-2xl bg-muted/20">
                      <Package className="h-8 w-8 text-muted-foreground/25" />
                      <span className="text-xs text-muted-foreground">No assets yet</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CATEGORIES NEXUS ─────────────────── */}
        {categories.length > 0 && (
          <section className="py-10 bg-muted/30 border-y border-border/60 overflow-hidden">
            <div className="container-page">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold tracking-tight">Browse categories</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">Find the right tool for your workflow</p>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-accent text-xs font-medium h-7 px-2.5 -mr-2 shrink-0 hover:bg-accent/5">
                  <Link href="/products" className="inline-flex items-center">
                    View all <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>

              <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar snap-x snap-mandatory scroll-px-1">
                {categories.map((cat: any) => {
                  const count = products.filter((p: any) => p.categorySlug === cat.slug).length;
                  return (
                    <Link key={cat.id} href={`/products?category=${cat.slug}`} className="shrink-0 snap-start">
                      <div className="w-36 bg-white border border-border/60 rounded-xl px-3 py-3.5 flex flex-col items-center gap-2 text-center transition-all duration-200 hover:border-accent/25 hover:shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 group">
                        <span className="text-[22px] leading-none transition-transform duration-200 group-hover:scale-105">{cat.iconEmoji || '📦'}</span>
                        <div className="min-w-0 w-full">
                          <p className="font-medium text-xs leading-tight line-clamp-1">{cat.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{count} items</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── TRENDING ─────────────────────────── */}
        {trending.length > 0 && (
          <section className="py-10 overflow-hidden">
            <div className="container-page">
              <div className="flex items-end justify-between gap-4 mb-5">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold tracking-tight">Trending now</h2>
                  <p className="text-xs text-muted-foreground mt-1">Most popular this week — hand-picked by the community</p>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-accent text-xs font-medium h-7 px-2.5 -mr-2 shrink-0 hover:bg-accent/5 hidden sm:inline-flex">
                  <Link href="/products" className="inline-flex items-center">
                    All products <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="text-accent text-xs font-medium h-7 px-2 -mr-2 shrink-0 sm:hidden">
                  <Link href="/products" className="inline-flex items-center">
                    All <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
              <ProductGrid products={trending} />
            </div>
          </section>
        )}

        {/* ── FEATURES ─────────────────────────── */}
        <section className="py-10 bg-white border-y border-border/60 overflow-hidden">
          <div className="container-page">
            <div className="max-w-2xl mb-6">
              <h2 className="text-base font-semibold tracking-tight">Why Prontly</h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Everything you need for professional digital delivery — verified, fast, and built to last.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-x-6 sm:gap-y-5">
              {[
                ['Instant Access', 'Download immediately after payment via Cloudflare R2 edge.', Zap],
                ['Expert Crafted', 'Engineered prompts tested for production accuracy.', Cpu],
                ['Lifetime Updates', 'Future versions at no additional cost.', CheckCircle2],
                ['Secure Payments', 'PCI-compliant processing for every transaction.', ShieldCheck],
                ['Any Device', 'Access your library from anywhere.', Globe],
                ['Verified Quality', 'Rigorous verification before listing.', ShieldCheck],
              ].map(([title, desc, Icon]: any) => (
                <div key={title} className="flex gap-2.5 rounded-xl border border-transparent hover:border-border/60 hover:bg-muted/20 p-2.5 -m-2.5 transition-colors duration-200">
                  <div className="h-7 w-7 rounded-lg bg-accent/[0.07] border border-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-3.5 w-3.5 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-none tracking-tight">{title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────── */}
        <section className="py-10 overflow-hidden">
          <div className="container-page">
            <div className="rounded-2xl bg-zinc-900 text-white px-6 py-8 md:px-8 md:py-10 text-center relative overflow-hidden">
              {/* subtle radial + grid */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_10%,rgba(59,130,246,0.14),transparent_55%)] pointer-events-none" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px] opacity-[0.15] pointer-events-none" aria-hidden />
              <div className="relative z-10 max-w-[520px] mx-auto flex flex-col items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-2.5 py-1 text-[11px] font-medium tracking-wide text-white/80 backdrop-blur">
                  <Clock className="h-3 w-3" /> Setup in under 2 minutes
                </span>
                <h2 className="text-lg md:text-xl font-bold tracking-tight leading-tight text-pretty">Start building faster</h2>
                <p className="text-sm text-white/60 leading-relaxed max-w-[42ch] text-pretty">Join thousands of creators scaling their workflow with our verified catalog. One purchase, lifetime access.</p>
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  <Button asChild className="bg-white text-zinc-900 hover:bg-white/90 h-9 px-6 text-sm font-semibold rounded-full shadow-none transition-all hover:translate-y-[-1px]">
                    <Link href="/products" className="inline-flex items-center gap-1.5">
                      Browse catalog <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full h-9 px-6 text-sm font-medium bg-transparent border-white/15 text-white hover:bg-white/10 hover:text-white">
                    <Link href="/products?view=categories">View categories</Link>
                  </Button>
                </div>
                <p className="text-[11px] text-white/40 pt-1">No subscription · Instant delivery · Secure checkout</p>
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
