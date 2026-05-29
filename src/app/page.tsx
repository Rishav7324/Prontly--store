'use client';

import { useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductGrid } from '@/components/store/ProductGrid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Sparkles, ShieldCheck, ChevronRight, Zap } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, limit, orderBy, doc } from 'firebase/firestore';
import Link from 'next/link';

export default function Home() {
  const db = useFirestore();

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'main') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const categoriesQuery = useMemoFirebase(() => db ? collection(db, 'categories') : null, [db]);
  const { data: categories } = useCollection(categoriesQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(20));
  }, [db]);

  const { data: allProducts, loading } = useCollection(productsQuery);

  const featuredProducts = useMemo(() => {
    if (!allProducts) return [];
    if (settings?.featuredProductIds && settings.featuredProductIds.length > 0) {
      return allProducts.filter(p => settings.featuredProductIds.includes(p.id));
    }
    return allProducts.slice(0, 8);
  }, [allProducts, settings]);

  const heroHeadline = settings?.homepageHeroCopy?.headline || "Expert Digital Assets for Modern Creators.";
  const heroSubheadline = settings?.homepageHeroCopy?.subheadline || "Unlock high-performance AI prompts, UI kits, and professional guides. Built for creators who demand precision.";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Architectural Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-20 lg:pt-20 lg:pb-48 bg-midnight-ink min-h-[600px] flex items-center">
          {/* High-Performance Background Video */}
          <div className="absolute inset-0 z-0">
            <video 
              src="https://cdn.prontly.in/Hero%20video/342475.mp4"
              autoPlay 
              muted 
              loop 
              playsInline
              preload="auto"
              className="w-full h-full object-cover opacity-40 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-midnight-ink/60 via-midnight-ink/20 to-background" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
          </div>

          <div className="container mx-auto px-4 relative z-10 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              <div className="lg:col-span-7 space-y-8">
                <div className="space-y-4">
                  <Badge variant="outline" className="bg-primary/10 backdrop-blur-md border-primary/30 text-primary px-4 py-1.5 font-bold uppercase tracking-widest text-[10px] rounded-full shadow-lg">
                    <Sparkles className="h-3 w-3 mr-2 inline animate-pulse" />
                    Market Intelligence Platform
                  </Badge>
                  <h1 className="text-4xl md:text-5xl lg:text-7xl font-headline font-light text-white leading-[1.1] tracking-tight">
                    {heroHeadline}
                  </h1>
                </div>
                
                <p className="text-base md:text-lg text-white/70 max-w-xl leading-relaxed font-light">
                  {heroSubheadline}
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <Button asChild size="lg" className="h-12 px-10 rounded-md bg-deep-violet hover:bg-deep-violet/90 text-white font-bold shadow-2xl shadow-primary/40 transition-all hover:scale-105">
                    <Link href="/products">Explore Inventory</Link>
                  </Button>
                  <Button asChild variant="ghost" size="lg" className="h-12 px-6 text-white hover:text-primary font-bold hover:bg-white/10">
                    <Link href="/signup" className="flex items-center gap-2">
                      Get started <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-5 relative hidden lg:block">
                 <div className="relative aspect-square w-full rounded-2xl shadow-[0_0_50px_rgba(83,58,253,0.3)] overflow-hidden bg-midnight-ink border border-white/10 group group-hover:border-primary/50 transition-all duration-500">
                    <div className="absolute inset-0 bg-primary/5 group-hover:bg-transparent transition-colors z-10" />
                    <video 
                      src="https://cdn.prontly.in/Hero%20video/342475.mp4"
                      autoPlay 
                      muted 
                      loop 
                      playsInline
                      preload="auto"
                      className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-midnight-ink/40 via-transparent to-primary/20 mix-blend-overlay z-20" />
                 </div>
                 
                 {/* Floating Badge */}
                 <div className="absolute -bottom-6 -left-6 bg-white p-5 rounded-2xl shadow-2xl border border-stone-gray/10 animate-bounce [animation-duration:4000ms] z-30">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 shadow-inner">
                          <ShieldCheck className="h-7 w-7" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase text-ghost-gray tracking-widest">Verified Source</p>
                          <p className="text-sm font-bold text-midnight-ink">Secure Delivery</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="bg-porcelain-white/50 py-24 border-y border-stone-gray/20">
          <div className="container mx-auto px-4 max-w-7xl">
            <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-4">
                <Badge variant="outline" className="text-deep-violet border-deep-violet/20 bg-deep-violet/5 font-bold uppercase text-[10px] tracking-[0.2em] px-3 py-1">
                  Asset Classification
                </Badge>
                <h2 className="text-3xl md:text-4xl font-headline font-light text-midnight-ink tracking-tight">Specialized infrastructure.</h2>
              </div>
              <Button variant="ghost" asChild className="text-deep-violet font-bold h-auto p-0 flex items-center gap-2 hover:bg-transparent hover:translate-x-1 transition-all">
                <Link href="/products">
                  Full catalog overview <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </header>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {categories?.map((cat: any) => (
                <Link key={cat.id} href={`/products?category=${cat.slug}`}>
                  <Card className="group h-full bg-white border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-md overflow-hidden relative">
                    <CardContent className="p-8 space-y-6">
                      <div className="h-12 w-12 rounded-lg bg-powder-blue/50 flex items-center justify-center group-hover:bg-deep-violet/10 transition-colors">
                        <span className="text-2xl">{cat.iconEmoji}</span>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold mb-2 text-midnight-ink">{cat.name}</h4>
                        <p className="text-sm text-slate-blue leading-relaxed line-clamp-3">{cat.description}</p>
                      </div>
                      <div className="pt-4 flex items-center text-xs font-black uppercase text-ghost-gray tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        Explore track <ChevronRight className="h-3 w-3 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Section */}
        <section className="container mx-auto px-4 py-24 max-w-7xl">
          <div className="mb-12 space-y-4 border-b border-stone-gray/10 pb-12">
            <Badge variant="outline" className="text-green-600 border-green-500/20 bg-green-500/5 font-bold uppercase text-[10px] tracking-[0.2em] px-3 py-1">
              Top Tier Assets
            </Badge>
            <h2 className="text-3xl md:text-4xl font-headline font-light text-midnight-ink tracking-tight">Professional standards.</h2>
          </div>

          <ProductGrid products={featuredProducts} loading={loading} />
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-24">
          <div className="max-w-7xl mx-auto rounded-xl bg-midnight-ink text-white p-12 md:p-24 text-center space-y-10 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(83,58,253,0.2),transparent)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(247,45,243,0.1),transparent)]" />
            
            <div className="relative z-10 space-y-8">
              <h2 className="text-3xl md:text-5xl font-headline font-light max-w-4xl mx-auto tracking-tight">Accelerate your workflow with precision.</h2>
              <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto font-light">Join thousands of verified creators scaling their business with Prontly assets.</p>
              <div className="flex flex-wrap justify-center gap-6 pt-10">
                <Button asChild size="lg" className="bg-white text-midnight-ink hover:bg-porcelain-white h-12 px-10 text-sm font-bold shadow-xl">
                  <Link href="/signup">Get started now</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-white border-white/20 hover:bg-white/10 h-12 px-10 text-sm font-bold">
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
