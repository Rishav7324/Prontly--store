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
        <section className="container mx-auto px-4 pt-32 pb-24 lg:pt-48">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-8 space-y-8">
                <p className="text-gravel font-medium tracking-[0.05em] uppercase text-xs">
                  Premium Digital Inventory
                </p>
                <h1 className="text-5xl md:text-7xl lg:text-[84px] leading-[1.05] text-obsidian max-w-4xl">
                  {heroHeadline}
                </h1>
                <p className="text-lg md:text-xl text-gravel max-w-xl leading-relaxed">
                  {heroSubheadline}
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <Button asChild size="lg" className="h-12 px-8">
                    <Link href="/products">Explore Marketplace</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="h-12 px-8">
                    <Link href="/signup">Create Account</Link>
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="mt-32 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-chalk pt-12">
              {[
                { icon: Shield, label: 'Lifetime Updates' },
                { icon: Rocket, label: 'Instant Delivery' },
                { icon: Crown, label: 'Hand-Curated' },
                { icon: Zap, label: 'Pro Optimized' },
              ].map((feature, i) => (
                <div key={i} className="space-y-3">
                  <feature.icon className="h-5 w-5 text-obsidian" />
                  <span className="block font-medium text-xs uppercase tracking-widest text-gravel">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="bg-powder py-32">
          <div className="container mx-auto px-4 max-w-[1200px]">
            <header className="mb-16 space-y-4">
              <p className="text-gravel font-medium uppercase text-[10px] tracking-[0.2em]">Curated Categories</p>
              <h2 className="text-4xl md:text-5xl text-obsidian">Browse by Specialty</h2>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories?.map((cat: any) => (
                <Link key={cat.id} href={`/products?category=${cat.slug}`}>
                  <Card className="group h-full bg-white border-chalk hover:border-obsidian transition-all duration-300 rounded-2xl hairline-shadow inset-detail overflow-hidden">
                    <CardContent className="p-8 space-y-6">
                      <div className="h-12 w-12 rounded-xl bg-powder flex items-center justify-center group-hover:bg-obsidian group-hover:text-white transition-all">
                        <span className="text-2xl">{cat.iconEmoji}</span>
                      </div>
                      <div>
                        <h4 className="text-xl font-headline mb-2 text-obsidian">{cat.name}</h4>
                        <p className="text-sm text-gravel leading-relaxed line-clamp-2">{cat.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Section */}
        <section className="container mx-auto px-4 py-32 max-w-[1200px]">
          <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end border-b border-chalk pb-12">
            <div className="max-w-xl space-y-4">
              <p className="text-gravel font-medium uppercase text-[10px] tracking-[0.2em]">Trending Now</p>
              <h2 className="text-4xl md:text-5xl text-obsidian">Professional Selection</h2>
            </div>
            <Button asChild variant="ghost" className="gap-2 group text-obsidian">
              <Link href="/products">
                View All Assets <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          <ProductGrid products={featuredProducts} loading={loading} />
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-32">
          <div className="max-w-[1200px] mx-auto rounded-[32px] bg-obsidian text-white p-12 md:p-24 text-center space-y-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-powder/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <h2 className="text-4xl md:text-6xl max-w-3xl mx-auto">Elevate your digital workflow today.</h2>
            <p className="text-lg text-white/60 max-w-xl mx-auto">Join a community of thousands of designers and developers using Prontly assets.</p>
            <div className="flex flex-wrap justify-center gap-4 pt-6">
              <Button asChild size="lg" variant="outline" className="bg-white text-obsidian border-none hover:bg-powder h-14 px-12 text-lg">
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}