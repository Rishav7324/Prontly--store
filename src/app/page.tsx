'use client';

import { useMemo, useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductGrid } from '@/components/store/ProductGrid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  CheckCircle2
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const db = useFirestore();

  const categoriesQuery = useMemoFirebase(() => db ? collection(db, 'categories') : null, [db]);
  const { data: categories } = useCollection(categoriesQuery);

  const productsQuery = useMemoFirebase(() => {
    return db ? collection(db, 'products') : null;
  }, [db]);

  const { data: rawProducts, loading } = useCollection(productsQuery);

  const trendingProducts = useMemo(() => {
    if (!rawProducts) return [];
    return [...rawProducts]
      .filter(p => p.isPublished !== false)
      .sort((a,b) => (b.salesCount || 0) - (a.salesCount || 0))
      .slice(0, 4);
  }, [rawProducts]);

  const stats = useMemo(() => {
    if (!rawProducts) return { downloads: 0, count: 0, rating: '0.0' };
    const totalDownloads = rawProducts.reduce((sum, p) => sum + (p.salesCount || 0), 0);
    const avgRating = rawProducts.length > 0 
      ? (rawProducts.reduce((sum, p) => sum + (p.averageRating || 5.0), 0) / rawProducts.length).toFixed(1)
      : '5.0';
    return {
      downloads: totalDownloads,
      count: rawProducts.length,
      rating: avgRating
    };
  }, [rawProducts]);

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-accent selection:text-white">
      <Navbar />
      
      <main className="flex-1">
        {/* DESIGN SYSTEM HERO */}
        <section className="relative pt-32 pb-16 lg:pt-48 lg:pb-24 overflow-hidden">
          <div className="container mx-auto px-4 relative z-10 max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-8">
                <div className="space-y-4">
                  <Badge variant="outline" className="bg-white border-accent/20 text-accent px-3 py-1 font-semibold uppercase tracking-wider text-[11px] rounded-full shadow-sm">
                    <Sparkles className="h-3 w-3 mr-2 inline text-accent fill-accent/10" />
                    Verified Digital Inventory
                  </Badge>
                  <h1 className="text-display-lg text-foreground">
                    Build Faster With <span className="text-accent">Premium Assets</span> Built for Results
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
                    Discover professionally crafted prompts, automation systems, creator resources, and business-ready workflows.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Button asChild size="lg" className="rounded-xl shadow-xl shadow-accent/20">
                    <Link href="/products">Explore Products</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-xl">
                    <Link href="/products?view=categories">View Categories</Link>
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-x-10 gap-y-4 pt-10 opacity-70">
                  {[
                    { label: `${stats.downloads}+ Downloads`, icon: Zap },
                    { label: `${stats.count} Assets`, icon: Package },
                    { label: `${stats.rating} Rating`, icon: Star },
                    { label: "Instant Access", icon: Clock },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <stat.icon className="h-4 w-4 text-accent" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Product Stack - REAL DATA ONLY */}
              <div className="lg:col-span-5 relative hidden lg:block perspective-1000">
                 <div className="relative group h-[500px] w-full">
                    {trendingProducts.length > 0 ? (
                      <>
                        <div className="absolute top-0 right-0 w-72 aspect-[4/5] surface-container rounded-2xl overflow-hidden transform rotate-6 translate-x-10 translate-y-10 transition-all duration-700 hover:rotate-3">
                           <Image 
                             src={trendingProducts[0]?.images?.[0] || '/placeholder-asset.webp'} 
                             alt={trendingProducts[0]?.name} 
                             fill 
                             className="object-cover" 
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                              <p className="text-white font-bold text-base">{trendingProducts[0]?.name}</p>
                           </div>
                        </div>

                        {trendingProducts.length > 1 && (
                          <div className="absolute top-16 right-16 w-72 aspect-[4/5] surface-container rounded-2xl overflow-hidden transform -rotate-3 transition-all duration-1000 hover:rotate-0">
                             <Image 
                               src={trendingProducts[1]?.images?.[0] || '/placeholder-asset.webp'} 
                               alt={trendingProducts[1]?.name} 
                               fill 
                               className="object-cover" 
                             />
                             <div className="absolute inset-0 bg-gradient-to-t from-accent/80 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button className="rounded-full h-12 w-12 p-0 bg-white text-accent" asChild>
                                   <Link href={`/products/${trendingProducts[1]?.slug}`}>
                                     <ArrowRight className="h-5 w-5" />
                                   </Link>
                                </Button>
                             </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-stone-gray/10 rounded-[3rem] bg-muted/5">
                        <Package className="h-16 w-16 text-muted-foreground opacity-20" />
                      </div>
                    )}
                 </div>
              </div>
            </div>
          </div>
          
          <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] -z-10" />
        </section>

        {/* CATEGORIES NEXUS */}
        <section className="py-20 bg-muted/30 border-y border-stone-gray/5">
          <div className="container mx-auto px-4 max-w-7xl">
            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div className="space-y-1">
                <h2 className="text-headline-xl">Asset Categories</h2>
                <p className="text-muted-foreground text-sm font-medium">Explore the technical depth of our verified collections.</p>
              </div>
              <Button variant="ghost" asChild className="text-accent font-bold hover:bg-accent/5">
                <Link href="/products">Browse All <ArrowRight className="h-4 w-4 ml-2" /></Link>
              </Button>
            </header>

            <div className="flex overflow-x-auto gap-5 pb-6 no-scrollbar snap-x">
              {categories?.map((cat: any) => (
                <Link key={cat.id} href={`/products?category=${cat.slug}`} className="snap-start shrink-0">
                  <div className="w-56 h-64 bg-white border border-border rounded-2xl p-8 flex flex-col items-center text-center justify-center space-y-5 card-lift shadow-sm">
                    <div className="h-16 w-16 rounded-xl bg-muted flex items-center justify-center shadow-inner">
                      <span className="text-3xl">{cat.iconEmoji || '📦'}</span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-base leading-tight">{cat.name}</h4>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{cat.productCount || 0} Assets</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* TRENDING NOW */}
        <section className="py-20 container mx-auto px-4 max-w-7xl">
           <header className="mb-12 text-center space-y-3">
              <Badge variant="outline" className="bg-secondary/5 border-secondary/20 text-secondary px-3 py-0.5 rounded-full uppercase tracking-widest text-[10px] font-black">Trending Now</Badge>
              <h2 className="text-headline-xl">Most Popular This Week</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">High-performing assets currently used by our active community.</p>
           </header>
           
           <ProductGrid products={trendingProducts} loading={loading} />
        </section>

        {/* WHY PRONTLY */}
        <section className="py-24 bg-white overflow-hidden relative">
           <div className="container mx-auto px-4 max-w-7xl relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-16">
                 {[
                   { title: "Instant Access", desc: "Download source files immediately after payment verification.", icon: Zap },
                   { title: "Expert Crafted", desc: "Professionally engineered prompts tested for production accuracy.", icon: Cpu },
                   { title: "Lifetime Updates", desc: "Future version updates and technical maintenance included.", icon: CheckCircle2 },
                   { title: "Secure Payments", desc: "Enterprise-grade encryption protecting every digital transaction.", icon: ShieldCheck },
                   { title: "Mobile Friendly", desc: "Access your dashboard and library from any device.", icon: Globe },
                   { title: "Verified Quality", desc: "All digital assets undergo rigorous technical verification.", icon: ShieldCheck },
                 ].map((feature, i) => (
                   <div key={i} className="flex gap-6 group">
                      <div className="h-14 w-14 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300 shrink-0 shadow-sm">
                         <feature.icon className="h-7 w-7" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-bold text-midnight-ink">{feature.title}</h4>
                        <p className="text-muted-foreground text-sm leading-relaxed font-medium">{feature.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </section>

        {/* FINAL CONVERSION */}
        <section className="container mx-auto px-4 py-24 max-w-7xl">
           <div className="rounded-[2.5rem] bg-accent text-white p-12 lg:p-20 text-center space-y-8 relative overflow-hidden shadow-2xl shadow-accent/30 group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]" />
              <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
                 <Zap className="h-48 w-48" />
              </div>
              
              <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
                <Badge className="bg-white/10 text-white border-white/20 uppercase tracking-[0.2em] font-black py-1 px-4 rounded-full text-[10px]">Scale Your Workflow</Badge>
                <h2 className="text-3xl md:text-5xl font-bold leading-tight">Start Building Faster With <br className="hidden md:block" /> Premium Assets</h2>
                <p className="text-lg text-white/80 font-medium max-w-xl mx-auto">Join thousands of creators scaling their creative architecture with our verified library.</p>
                
                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6">
                  <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 h-14 px-12 text-sm font-bold rounded-xl shadow-xl transition-all hover:scale-105">
                    <Link href="/products">Get Started Now</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-white border-white/20 hover:bg-white/10 h-14 px-12 text-sm font-bold rounded-xl">
                    <Link href="/products">Browse Categories</Link>
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
