'use client';

import { useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductGrid } from '@/components/store/ProductGrid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Sparkles, ShieldCheck, ChevronRight, Zap, Globe, Cpu } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const db = useFirestore();

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'main') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const categoriesQuery = useMemoFirebase(() => db ? collection(db, 'categories') : null, [db]);
  const { data: categories } = useCollection(categoriesQuery);

  const productsQuery = useMemoFirebase(() => {
    return db ? collection(db, 'products') : null;
  }, [db]);

  const { data: rawProducts, loading } = useCollection(productsQuery);

  const featuredProducts = useMemo(() => {
    if (!rawProducts) return [];
    
    const allProductsSorted = [...rawProducts].sort((a: any, b: any) => {
      const dateA = a.createdAt?.toMillis?.() || a.updatedAt?.toMillis?.() || 0;
      const dateB = b.createdAt?.toMillis?.() || b.updatedAt?.toMillis?.() || 0;
      return dateB - dateA;
    });

    if (settings?.featuredProductIds && settings.featuredProductIds.length > 0) {
      const featured = allProductsSorted.filter(p => settings.featuredProductIds.includes(p.id));
      if (featured.length > 0) return featured;
    }
    
    return allProductsSorted.slice(0, 8);
  }, [rawProducts, settings]);

  const heroHeadline = settings?.homepageHeroCopy?.headline || "Elite Architecture for Modern Creators.";
  const heroSubheadline = settings?.homepageHeroCopy?.subheadline || "Professional-grade AI prompts, modular UI systems, and high-performance documentation. Engineered to scale your workflow.";

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary selection:text-white">
      <Navbar />
      
      <main className="flex-1">
        {/* COMPACT HERO SECTION */}
        <section className="relative pt-20 pb-20 lg:pt-32 lg:pb-32 overflow-hidden dreamy-gradient">
          <div className="container mx-auto px-4 relative z-10 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-4">
                  <Badge variant="outline" className="bg-white/80 border-primary/20 text-primary px-3 py-1 font-bold uppercase tracking-widest text-[9px] rounded-full">
                    <Sparkles className="h-2.5 w-2.5 mr-2 inline" />
                    Market Intelligence Platform
                  </Badge>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline leading-[1.1] text-midnight-ink tracking-tight max-w-xl">
                    {heroHeadline}
                  </h1>
                  <p className="text-base md:text-lg text-slate-blue max-w-lg leading-relaxed font-medium">
                    {heroSubheadline}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Button asChild size="lg" className="h-12 px-8 rounded-lg bg-deep-violet text-white font-bold shadow-lg transition-all active:scale-95 text-sm">
                    <Link href="/products">Explore Inventory</Link>
                  </Button>
                  <Button asChild variant="ghost" className="h-12 px-6 text-midnight-ink hover:text-primary font-bold transition-colors group text-sm">
                    <Link href="/signup" className="flex items-center gap-2">
                      Initialize account <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-8 pt-8 border-t border-stone-gray/10">
                  <div className="flex items-center gap-2 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
                    <ShieldCheck className="h-4 w-4 text-green-600" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-midnight-ink">Audit Verified</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
                    <Globe className="h-4 w-4 text-blue-600" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-midnight-ink">Edge Delivery</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
                    <Cpu className="h-4 w-4 text-primary" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-midnight-ink">Performance Core</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 relative hidden lg:block">
                 <div className="relative aspect-[4/5] w-full rounded-3xl shadow-2xl overflow-hidden bg-white border border-white/50 group">
                    <Image 
                      src="https://picsum.photos/seed/prontly-platinum/1000/1250" 
                      alt="Interface" 
                      fill 
                      className="object-cover transition-transform duration-1000 group-hover:scale-105"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-midnight-ink/10 to-transparent" />
                 </div>
                 
                 <div className="absolute -bottom-6 -left-8 bg-white/95 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/50">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <Zap className="h-6 w-6" />
                       </div>
                       <div>
                          <p className="text-[8px] font-black uppercase text-ghost-gray tracking-widest mb-0.5">Uptime Sync</p>
                          <p className="text-lg font-bold text-midnight-ink font-headline">99.9% Reliable</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMPACT CATEGORIES */}
        <section className="bg-white py-20 border-y border-stone-gray/10">
          <div className="container mx-auto px-4 max-w-6xl">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-2">
                <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 font-bold uppercase text-[8px] tracking-widest px-3 py-1 rounded-full">
                  Asset Classes
                </Badge>
                <h2 className="text-3xl md:text-4xl font-headline text-midnight-ink tracking-tight">Specialized categories.</h2>
              </div>
              <Button variant="ghost" asChild className="text-primary font-bold h-auto p-0 flex items-center gap-2 text-sm hover:translate-x-1 transition-all">
                <Link href="/products">Explore full inventory <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </header>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories?.map((cat: any) => (
                <Link key={cat.id} href={`/products?category=${cat.slug}`} className="group">
                  <Card className="h-full bg-porcelain-white/50 border border-stone-gray/10 shadow-sm group-hover:bg-white group-hover:border-primary/20 group-hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden">
                    <CardContent className="p-8 space-y-4">
                      <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <span className="text-2xl">{cat.iconEmoji}</span>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold mb-2 text-midnight-ink font-headline">{cat.name}</h4>
                        <p className="text-[13px] text-slate-blue leading-relaxed line-clamp-2 opacity-80">{cat.description}</p>
                      </div>
                      <div className="pt-2 flex items-center text-[9px] font-black uppercase text-ghost-gray tracking-widest group-hover:text-primary transition-colors">
                        View assets <ChevronRight className="h-3 w-3 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CURATED GRID */}
        <section className="container mx-auto px-4 py-20 max-w-6xl">
          <div className="mb-12 space-y-4 text-center md:text-left">
            <Badge variant="outline" className="text-green-600 border-green-500/20 bg-green-500/5 font-bold uppercase text-[8px] tracking-widest px-3 py-1 rounded-full">
              Production Standard
            </Badge>
            <h2 className="text-3xl md:text-4xl font-headline text-midnight-ink tracking-tight">Curated high-performance assets.</h2>
          </div>

          <ProductGrid products={featuredProducts} loading={loading} />
          
          <div className="mt-16 flex justify-center">
             <Button asChild variant="outline" size="lg" className="h-12 px-10 rounded-lg border-stone-gray/20 font-bold text-midnight-ink hover:bg-midnight-ink hover:text-white transition-all shadow-sm text-sm">
                <Link href="/products">View All {rawProducts?.length || 0} Products</Link>
             </Button>
          </div>
        </section>

        {/* COMPACT CTA */}
        <section className="container mx-auto px-4 py-20 max-w-6xl">
          <div className="rounded-[2.5rem] bg-midnight-ink text-white p-12 lg:p-24 text-center space-y-8 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(83,58,253,0.2),transparent)]" />
            
            <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
              <Badge className="bg-white/10 text-white border-white/20 uppercase tracking-widest font-black py-1 px-4 rounded-full text-[8px]">guidelines Initialize</Badge>
              <h2 className="text-3xl md:text-5xl font-headline tracking-tight">Accelerate your creative output.</h2>
              <p className="text-base md:text-lg text-white/60 font-light leading-relaxed max-w-xl mx-auto">Join thousands of creators using Prontly to scale their technical and artistic infrastructure.</p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
                <Button asChild size="lg" className="bg-white text-midnight-ink hover:bg-porcelain-white h-14 px-10 text-base font-bold rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95">
                  <Link href="/signup">Get Started Now</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-white border-white/20 hover:bg-white/10 h-14 px-10 text-base font-bold rounded-xl">
                  <Link href="/products">View full catalog</Link>
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