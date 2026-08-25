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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-[100vw] overflow-x-hidden">

        {/* ── HERO ─────────────────────────────── */}
        <section className="relative pt-20 pb-10 md:pt-28 md:pb-14 overflow-hidden">
          <div className="container-page relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              <div className="lg:col-span-7 space-y-5 min-w-0">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent bg-accent/8 border border-accent/15 rounded-full px-3 py-1">
                  <Sparkles className="h-3 w-3" /> Premium Digital Assets
                </span>
                <h1 className="text-display-lg">
                  Scale your creative <span className="text-accent">workflow</span> with verified tools
                </h1>
                <p className="text-sm md:text-base text-muted-foreground max-w-lg leading-relaxed">
                  Professionally crafted prompts, automation systems, and business-ready digital assets.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <Button asChild className="rounded-lg h-10 px-5 text-sm font-semibold shadow-sm group">
                    <Link href="/products" className="flex items-center gap-1.5">Explore<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-lg h-10 px-5 text-sm font-medium">
                    <Link href="/products?view=categories">Categories</Link>
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-5 border-t border-border/60 max-w-full">
                  {[
                    [`${stats.downloads}+`, 'Downloads'],
                    [`${stats.count}`, 'Assets'],
                    [`${stats.rating}★`, 'Rating'],
                    ['Instant', 'Access'],
                  ].map(([v, l]) => (
                    <div key={l} className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold">{v}</span>
                      <span className="text-[11px] text-muted-foreground">{l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hero visual */}
              <div className="lg:col-span-5 hidden lg:block">
                <div className="relative h-[380px] overflow-hidden rounded-xl">
                  {trending.length > 0 ? (
                    <>
                      <Image src={trending[0]?.images?.[0] || ''} alt={trending[0]?.name || ''} fill className="object-cover rounded-xl" sizes="(max-width:1024px) 0px, 400px" priority />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <p className="text-white text-sm font-semibold line-clamp-1">{trending[0]?.name}</p>
                        <p className="text-white/70 text-xs mt-0.5">₹{((trending[0]?.price || 0) / 100).toLocaleString('en-IN')}</p>
                      </div>
                      {trending[1] && (
                        <div className="absolute -bottom-3 -left-6 w-32 aspect-square rounded-lg overflow-hidden border-2 border-white shadow-lg rotate-[-4deg]">
                          <Image src={trending[1]?.images?.[0] || ''} alt="" fill className="object-cover" sizes="128px" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center border border-dashed border-border rounded-xl bg-muted/30"><Package className="h-12 w-12 text-muted-foreground/20" /></div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CATEGORIES ───────────────────────── */}
        {categories.length > 0 && (
          <section className="py-8 md:py-10 bg-muted/40 border-y border-border/60">
            <div className="container-page">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base md:text-lg font-semibold">Categories</h2>
                <Button variant="ghost" size="sm" asChild className="text-accent text-xs font-medium -mr-2">
                  <Link href="/products">View all <ArrowRight className="h-3 w-3 ml-1" /></Link>
                </Button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar snap-x">
                {categories.map((cat: any) => {
                  const count = products.filter((p: any) => p.categorySlug === cat.slug).length;
                  return (
                    <Link key={cat.id} href={`/products?category=${cat.slug}`} className="shrink-0 snap-start">
                      <div className="w-36 md:w-44 bg-white border border-border/60 rounded-xl p-4 flex flex-col items-center gap-2.5 text-center transition-all hover:border-accent/30 hover:shadow-md card-hover">
                        <span className="text-2xl">{cat.iconEmoji || '📦'}</span>
                        <div>
                          <p className="font-medium text-xs leading-tight line-clamp-2">{cat.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{count} items</p>
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
          <section className="section-pad container-page">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg md:text-xl font-semibold">Trending now</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Most popular this week</p>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-accent text-xs font-medium -mr-2">
                <Link href="/products">All products <ArrowRight className="h-3 w-3 ml-1" /></Link>
              </Button>
            </div>
            <ProductGrid products={trending} />
          </section>
        )}

        {/* ── FEATURES ─────────────────────────── */}
        <section className="py-10 md:py-14 bg-white border-y border-border/60">
          <div className="container-page">
            <h2 className="text-lg md:text-xl font-semibold mb-1.5">Why Prontly</h2>
            <p className="text-xs text-muted-foreground mb-7">Everything you need for professional digital delivery.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
              {[
                ['Instant Access', 'Download immediately after payment via Cloudflare R2 edge.', Zap],
                ['Expert Crafted', 'Engineered prompts tested for production accuracy.', Cpu],
                ['Lifetime Updates', 'Future versions at no additional cost.', CheckCircle2],
                ['Secure Payments', 'PCI-compliant processing for every transaction.', ShieldCheck],
                ['Any Device', 'Access your library from anywhere.', Globe],
                ['Verified Quality', 'Rigorous verification before listing.', ShieldCheck],
              ].map(([title, desc, Icon]: any) => (
                <div key={title} className="flex gap-3">
                  <div className="h-8 w-8 rounded-lg bg-accent/8 border border-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-3.5 w-3.5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────── */}
        <section className="container-page py-10 md:py-14">
          <div className="rounded-2xl bg-zinc-900 text-white p-8 md:p-12 text-center space-y-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(59,130,246,0.15),transparent)]" />
            <div className="relative z-10 space-y-3 max-w-md mx-auto">
              <h2 className="text-xl md:text-2xl font-bold leading-tight">Start building faster</h2>
              <p className="text-sm text-white/60 leading-relaxed">Join creators scaling their workflow with our verified catalog.</p>
              <Button asChild className="mt-3 bg-white text-zinc-900 hover:bg-white/90 h-10 px-8 text-sm font-semibold rounded-lg transition-all hover:scale-[1.02]">
                <Link href="/products">Browse catalog</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <RecentPurchasePopup />
      <Footer />
    </div>
  );
}
