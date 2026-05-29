'use client';

import { useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductGrid } from '@/components/store/ProductGrid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Sparkles, ShieldCheck, ChevronRight, Zap, Globe, Layers, Cpu } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, limit, orderBy, doc } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const db = useFirestore();

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'main') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const categoriesQuery = useMemoFirebase(() => db ? collection(db, 'categories') : null, [db]);
  const { data: categories } = useCollection(categoriesQuery);

  // Resilient Collection Fetch:
  // We fetch without server-side ordering to ensure documents without createdAt fields aren't excluded.
  const productsQuery = useMemoFirebase(() => {
    return db ? collection(db, 'products') : null;
  }, [db]);

  const { data: rawProducts, loading } = useCollection(productsQuery);

  const featuredProducts = useMemo(() => {
    if (!rawProducts) return [];
    
    // 1. Sort all products by date in-memory
    const allProductsSorted = [...rawProducts].sort((a: any, b: any) => {
      const dateA = a.createdAt?.toMillis?.() || a.updatedAt?.toMillis?.() || 0;
      const dateB = b.createdAt?.toMillis?.() || b.updatedAt?.toMillis?.() || 0;
      return dateB - dateA;
    });

    // 2. Filter for specifically featured items if defined in settings
    if (settings?.featuredProductIds && settings.featuredProductIds.length > 0) {
      const featured = allProductsSorted.filter(p => settings.featuredProductIds.includes(p.id));
      if (featured.length > 0) return featured;
    }
    
    // 3. Fallback to latest 8 products
    return allProductsSorted.slice(0, 8);
  }, [rawProducts, settings]);

  const heroHeadline = settings?.homepageHeroCopy?.headline || "Elite Infrastructure for Modern Creators.";
  const heroSubheadline = settings?.homepageHeroCopy?.subheadline || "Professional-grade AI prompts, modular UI systems, and high-performance technical documentation. Engineered for creators who scale.";

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary selection:text-white">
      <Navbar />
      
      <main className="flex-1">
        {/* PLATINUM HERO SECTION */}
        <section className="relative pt-20 pb-20 lg:pt-32 lg:pb-48 overflow-hidden dreamy-gradient">
          <div className="container mx-auto px-4 relative z-10 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-center">
              <div className="lg:col-span-7 space-y-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white/80 backdrop-blur-md border-primary/20 text-primary px-4 py-1.5 font-bold uppercase tracking-[0.2em] text-[10px] rounded-full shadow-sm">
                      <Sparkles className="h-3 w-3 mr-2 inline" />
                      Production V2.4 Active
                    </Badge>
                  </div>
                  <h1 className="text-5xl md:text-7xl lg:text-8xl font-headline leading-[1.05] text-midnight-ink tracking-tight">
                    {heroHeadline}
                  </h1>
                  <p className="text-lg md:text-xl text-slate-blue max-w-2xl leading-relaxed font-medium">
                    {heroSubheadline}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-6">
                  <Button asChild size="lg" className="h-14 px-10 rounded-xl bg-deep-violet hover:bg-deep-violet/90 text-white font-bold platinum-shadow transition-all hover:-translate-y-1 active:scale-95 text-lg">
                    <Link href="/products">Browse Inventory</Link>
                  </Button>
                  <Button asChild variant="ghost" size="lg" className="h-14 px-8 text-midnight-ink hover:text-primary font-bold hover:bg-primary/5 transition-colors group">
                    <Link href="/signup" className="flex items-center gap-3">
                      Start building <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-10 pt-12 border-t border-stone-gray/10">
                  <div className="flex items-center gap-3 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-midnight-ink">Audit Verified</span>
                  </div>
                  <div className="flex items-center gap-3 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-midnight-ink">Global Edge Delivery</span>
                  </div>
                  <div className="flex items-center gap-3 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
                    <Cpu className="h-5 w-5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-midnight-ink">High-Performance Core</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 relative hidden lg:block">
                 <div className="relative aspect-[4/5] w-full rounded-[2.5rem] platinum-shadow overflow-hidden bg-white border border-white/50 group">
                    <Image 
                      src="https://picsum.photos/seed/prontly-platinum/1000/1250" 
                      alt="Premium Marketplace Interface" 
                      fill 
                      className="object-cover transition-transform duration-1000 group-hover:scale-105"
                      data-ai-hint="luxury interface"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-midnight-ink/20 to-transparent" />
                 </div>
                 
                 {/* FLOATING PERFORMANCE INDICATOR */}
                 <div className="absolute -bottom-8 -left-12 bg-white/90 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/50 transition-transform hover:-translate-y-2 group cursor-default">
                    <div className="flex items-center gap-6">
                       <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                          <Zap className="h-8 w-8" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase text-ghost-gray tracking-[0.2em] mb-1">Execution Speed</p>
                          <p className="text-2xl font-bold text-midnight-ink font-headline">99.9% Sla Uptime</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* CLASSIFICATION GRID */}
        <section className="bg-white py-32 border-y border-stone-gray/10">
          <div className="container mx-auto px-4 max-w-7xl">
            <header className="mb-20 flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
              <div className="space-y-4">
                <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 font-bold uppercase text-[10px] tracking-[0.3em] px-4 py-1.5 rounded-full">
                  Operational Blocks
                </Badge>
                <h2 className="text-4xl md:text-5xl font-headline text-midnight-ink tracking-tight">Specialized categories.</h2>
              </div>
              <Button variant="ghost" asChild className="text-primary font-bold h-auto p-0 flex items-center gap-2 hover:bg-transparent hover:translate-x-1 transition-all">
                <Link href="/products" className="text-base">
                  Explore full documentation <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </header>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {categories?.map((cat: any) => (
                <Link key={cat.id} href={`/products?category=${cat.slug}`} className="group">
                  <Card className="h-full bg-porcelain-white/50 border border-stone-gray/10 shadow-sm group-hover:bg-white group-hover:border-primary/20 group-hover:shadow-2xl transition-all duration-500 rounded-[2rem] overflow-hidden">
                    <CardContent className="p-10 space-y-8">
                      <div className="h-16 w-16 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all group-hover:-rotate-6">
                        <span className="text-3xl">{cat.iconEmoji}</span>
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold mb-3 text-midnight-ink font-headline">{cat.name}</h4>
                        <p className="text-sm text-slate-blue leading-relaxed line-clamp-3">{cat.description}</p>
                      </div>
                      <div className="pt-4 flex items-center text-[10px] font-black uppercase text-ghost-gray tracking-[0.2em] group-hover:text-primary transition-colors">
                        View assets <ChevronRight className="h-3 w-3 ml-2" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CURATED INVENTORY */}
        <section className="container mx-auto px-4 py-32 max-w-7xl">
          <div className="mb-20 space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-[2px] w-12 bg-primary/20" />
              <Badge variant="outline" className="text-green-600 border-green-500/20 bg-green-500/5 font-bold uppercase text-[10px] tracking-[0.3em] px-4 py-1.5 rounded-full">
                Technical Highlights
              </Badge>
            </div>
            <h2 className="text-4xl md:text-5xl font-headline text-midnight-ink tracking-tight">Curated high-performance assets.</h2>
          </div>

          <ProductGrid products={featuredProducts} loading={loading} />
          
          <div className="mt-20 flex justify-center">
             <Button asChild variant="outline" size="lg" className="h-14 px-12 rounded-xl border-stone-gray/20 font-bold text-midnight-ink hover:bg-midnight-ink hover:text-white transition-all shadow-sm">
                <Link href="/products">View All {rawProducts?.length || 0} Products</Link>
             </Button>
          </div>
        </section>

        {/* ACTION TERMINAL */}
        <section className="container mx-auto px-4 py-24 max-w-7xl">
          <div className="rounded-[3rem] bg-midnight-ink text-white p-12 md:p-32 text-center space-y-12 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(83,58,253,0.3),transparent)]" />
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-primary/10 to-transparent" />
            
            <div className="relative z-10 space-y-10 max-w-4xl mx-auto">
              <Badge className="bg-white/10 text-white border-white/20 uppercase tracking-[0.4em] font-black py-1.5 px-6 rounded-full text-[10px]">Initialize Protocol</Badge>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-headline leading-tight tracking-tight">Accelerate your creative infrastructure.</h2>
              <p className="text-lg md:text-xl text-white/60 font-light leading-relaxed max-w-2xl mx-auto">Join a verified network of developers and designers using Prontly to scale their output.</p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-6 pt-10">
                <Button asChild size="lg" className="bg-white text-midnight-ink hover:bg-porcelain-white h-16 px-12 text-lg font-bold rounded-2xl shadow-2xl transition-all hover:scale-105 active:scale-95">
                  <Link href="/signup">Get Started Now</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-white border-white/20 hover:bg-white/10 h-16 px-12 text-lg font-bold rounded-2xl">
                  <Link href="/products">Browse full catalog</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
