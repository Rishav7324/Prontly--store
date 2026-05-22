'use client';

import { useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductGrid } from '@/components/store/ProductGrid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, Rocket, Shield, Crown, Search, CheckCircle2, ArrowRight, Layers, Layout, BookOpen, Sparkles } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, limit, orderBy, doc } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const db = useFirestore();

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'site_settings', 'main') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const categoriesQuery = useMemoFirebase(() => db ? collection(db, 'categories') : null, [db]);
  const { data: categories } = useCollection(categoriesQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'products'),
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
  }, [db]);

  const { data: allProducts, loading } = useCollection(productsQuery);

  const featuredProducts = useMemo(() => {
    if (!allProducts) return [];
    if (settings?.featuredProductIds && settings.featuredProductIds.length > 0) {
      return allProducts.filter(p => settings.featuredProductIds.includes(p.id));
    }
    return allProducts.slice(0, 8);
  }, [allProducts, settings]);

  const categoryIcons: Record<string, any> = {
    'prompts': Sparkles,
    'templates': Layout,
    'guides': BookOpen,
    'ui-kits': Layers
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-32 pb-40 lg:pt-48 lg:pb-56">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_120%,rgba(85,78,210,0.2),rgba(15,15,19,1))]" />
          <div className="container mx-auto px-4 text-center relative">
            <Badge variant="outline" className="mb-6 border-primary/50 text-primary py-1 px-4 text-sm font-medium animate-pulse rounded-full bg-primary/5">
              New: GPT-4o Optimized Prompts Now Available!
            </Badge>
            <h1 className="mx-auto max-w-5xl font-headline text-5xl font-bold tracking-tight md:text-8xl lg:leading-[1.1]">
              Master the Future with <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent text-shadow-glow">Expert Digital Assets</span>
            </h1>
            <p className="mx-auto mt-10 max-w-2xl text-lg text-muted-foreground md:text-2xl leading-relaxed">
              Unlock high-performance AI prompts, UI kits, and professional guides. Built for creators who demand precision.
            </p>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
              <Button asChild size="lg" className="h-14 px-10 text-lg rounded-2xl shadow-[0_20px_50px_rgba(85,78,210,0.3)] hover:scale-105 transition-all">
                <Link href="/products">Browse Marketplace</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-10 text-lg rounded-2xl border-white/10 hover:bg-white/5">
                <Link href="/products?category=prompts">Explore AI Prompts</Link>
              </Button>
            </div>

            <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {[
                { icon: Shield, label: 'Lifetime Updates' },
                { icon: Rocket, label: 'Instant Delivery' },
                { icon: Crown, label: 'Hand-Curated' },
                { icon: Zap, label: 'Pro Optimized' },
              ].map((feature, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/5 shadow-inner">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{feature.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="container mx-auto px-4 py-24 border-t border-white/5">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-headline mb-4">Browse by Category</h2>
            <p className="text-muted-foreground">Specialized assets for every stage of your workflow.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories?.map((cat: any) => {
              const Icon = categoryIcons[cat.slug] || Layout;
              return (
                <Link key={cat.id} href={`/products?category=${cat.slug}`}>
                  <Card className="group h-full bg-card/40 border-white/5 hover:border-primary/50 transition-all duration-300 rounded-3xl overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-8 flex flex-col items-center text-center relative z-10">
                      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        <span className="text-3xl">{cat.iconEmoji}</span>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{cat.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{cat.description}</p>
                      <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                        Explore <ArrowRight className="h-3 w-3" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Featured Section */}
        <section className="container mx-auto px-4 py-24">
          <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-xl">
              <Badge className="bg-primary/20 text-primary border-none mb-4">Curated Assets</Badge>
              <h2 className="text-4xl md:text-5xl font-bold font-headline">Trending This Week</h2>
              <p className="text-muted-foreground mt-4 text-lg leading-relaxed">Discover our most popular digital assets, chosen for their quality and performance.</p>
            </div>
            <Button asChild variant="ghost" className="text-primary hover:text-accent font-bold group">
              <Link href="/products" className="flex items-center gap-2">
                View All Marketplace
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          <ProductGrid products={featuredProducts} loading={loading} />
        </section>

        {/* Why Prontly Section */}
        <section className="bg-muted/30 py-32 border-y border-white/5">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-4xl md:text-5xl font-bold font-headline mb-6">Built for the Modern Workflow</h2>
              <p className="text-xl text-muted-foreground">We don't just sell assets; we sell time. Every item in our store is rigorously tested to ensure it works from day one.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                {
                  title: "Quality First",
                  desc: "Every AI prompt is tested against multiple models (GPT-4o, Claude 3.5, Gemini 1.5) to ensure consistent, high-quality results.",
                  icon: CheckCircle2
                },
                {
                  title: "Expertly Crafted",
                  desc: "Our UI templates follow modern accessibility standards and design best practices, making them production-ready out of the box.",
                  icon: Zap
                },
                {
                  title: "B2B Ready",
                  desc: "Automated GST invoicing and volume licensing options for teams and agencies looking to scale their production.",
                  icon: Shield
                }
              ].map((item, i) => (
                <div key={i} className="space-y-4 p-8 rounded-[2rem] bg-card border border-white/5 shadow-xl">
                  <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary mb-6">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold font-headline">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-32">
          <div className="relative rounded-[3rem] overflow-hidden bg-primary px-8 py-20 text-center text-white shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent)]" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-bold font-headline mb-8">Ready to elevate your creation?</h2>
              <p className="text-xl opacity-90 mb-12">Join thousands of creators using Prontly to speed up their workflow and deliver better results.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" variant="secondary" className="h-14 px-10 text-lg rounded-2xl">
                  <Link href="/signup">Get Started Now</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 px-10 text-lg rounded-2xl border-white/30 hover:bg-white/10">
                  <Link href="/products">Explore Store</Link>
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
