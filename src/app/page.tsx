'use client';

import { useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductGrid } from '@/components/store/ProductGrid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Rocket, Crown, Zap, ArrowRight, Layout, BookOpen, Layers, Sparkles } from 'lucide-react';
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
        {/* Hero Section */}
        <section className="relative overflow-hidden dreamy-gradient pt-32 pb-32 lg:pt-48 lg:pb-48">
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[100px]" />
          <div className="container mx-auto px-4 relative z-10 max-w-[1200px]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-8">
                <Badge variant="outline" className="bg-white/50 border-primary/20 text-primary px-3 py-1 font-bold uppercase tracking-widest text-[10px]">
                  Digital Command Center
                </Badge>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight">
                  {heroHeadline}
                </h1>
                <p className="text-lg md:text-xl text-secondary-foreground max-w-xl leading-relaxed">
                  {heroSubheadline}
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <Button asChild size="lg" className="h-12 px-8">
                    <Link href="/products">Explore Marketplace</Link>
                  </Button>
                  <Button asChild variant="ghost" size="lg" className="h-12 px-8 text-foreground font-bold">
                    <Link href="/signup" className="flex items-center gap-2">
                      Get started <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="lg:col-span-5 hidden lg:block">
                 <div className="relative aspect-square w-full rounded-lg stripe-shadow-xl overflow-hidden bg-white border border-border">
                    <div className="absolute inset-0 sunburst-gradient opacity-10" />
                    <div className="p-8 space-y-6">
                       <div className="h-8 w-32 bg-muted rounded animate-pulse" />
                       <div className="h-4 w-full bg-muted rounded animate-pulse" />
                       <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                       <div className="grid grid-cols-3 gap-4 pt-12">
                          {[1,2,3].map(i => <div key={i} className="aspect-video bg-muted rounded animate-pulse" />)}
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="bg-secondary/30 py-24 border-y border-border">
          <div className="container mx-auto px-4 max-w-[1200px]">
            <header className="mb-12 flex justify-between items-end">
              <div className="space-y-2">
                <p className="text-primary font-bold uppercase text-[10px] tracking-[0.2em]">Curated Tracks</p>
                <h2 className="text-3xl font-bold text-foreground tracking-tight">Browse by specialty</h2>
              </div>
              <Button variant="link" className="text-primary font-bold h-auto p-0 flex items-center gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories?.map((cat: any) => (
                <Link key={cat.id} href={`/products?category=${cat.slug}`}>
                  <Card className="group h-full bg-white border-none stripe-shadow-sm hover:stripe-shadow transition-all duration-300 rounded-md overflow-hidden">
                    <CardContent className="p-6 space-y-4">
                      <div className="h-10 w-10 rounded bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <span className="text-xl">{cat.iconEmoji}</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold mb-1 text-foreground">{cat.name}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{cat.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Section */}
        <section className="container mx-auto px-4 py-24 max-w-[1200px]">
          <div className="mb-12 space-y-2 border-b pb-8">
            <p className="text-primary font-bold uppercase text-[10px] tracking-[0.2em]">Market Intelligence</p>
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Professional selection</h2>
          </div>

          <ProductGrid products={featuredProducts} loading={loading} />
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-24">
          <div className="max-w-[1200px] mx-auto rounded-lg bg-foreground text-white p-12 md:p-24 text-center space-y-10 relative overflow-hidden stripe-shadow-xl">
            <div className="absolute inset-0 dreamy-gradient opacity-10" />
            <h2 className="text-4xl md:text-5xl font-bold max-w-3xl mx-auto tracking-tight">Ready to build your digital empire?</h2>
            <p className="text-lg text-white/60 max-w-xl mx-auto">Join a community of 50k+ designers and developers using Prontly assets.</p>
            <div className="flex flex-wrap justify-center gap-4 pt-6 relative z-10">
              <Button asChild size="lg" className="bg-white text-foreground hover:bg-secondary h-12 px-10 text-base font-bold">
                <Link href="/signup">Get started now</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-white border-white/20 hover:bg-white/10 h-12 px-10 text-base font-bold">
                <Link href="/products">Browse full catalog</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
