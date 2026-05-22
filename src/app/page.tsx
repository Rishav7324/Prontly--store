'use client';

import { useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductGrid } from '@/components/store/ProductGrid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Rocket, Shield, Crown, Search } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import Link from 'next/link';

export default function Home() {
  const db = useFirestore();

  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'products'),
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc'),
      limit(8)
    );
  }, [db]);

  const { data: products, loading } = useCollection(productsQuery);

  // Schema.org Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'Prontly Store',
    'url': 'https://store.prontly.in',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': 'https://store.prontly.in/products?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'Prontly Store',
    'url': 'https://store.prontly.in',
    'logo': 'https://store.prontly.in/logo.png',
    'contactPoint': {
      '@type': 'ContactPoint',
      'email': 'support@prontly.in',
      'contactType': 'customer support'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        
        <main className="flex-1">
          <section className="relative overflow-hidden pt-20 pb-32">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_120%,rgba(85,78,210,0.15),rgba(15,15,19,1))]" />
            <div className="container mx-auto px-4 text-center">
              <Badge variant="outline" className="mb-6 border-primary/50 text-primary py-1 px-4 text-sm font-medium animate-bounce">
                New: GPT-4o Optimized Prompts Now Available!
              </Badge>
              <h1 className="mx-auto max-w-4xl font-headline text-5xl font-bold tracking-tight md:text-7xl">
                Empower Your Workflow with <br />
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent text-shadow-glow">Premium Digital Assets</span>
              </h1>
              <p className="mx-auto mt-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
                The curated marketplace for AI prompts, UI kits, templates, and guides built for creators who value precision and speed.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Button asChild size="lg" className="h-12 px-8 text-base shadow-xl shadow-primary/20">
                  <Link href="/products">Start Browsing</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
                  <Link href="/products?category=prompts">Explore AI Prompts</Link>
                </Button>
              </div>

              <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { icon: Shield, label: 'Secure Delivery' },
                  { icon: Rocket, label: 'Instant Access' },
                  { icon: Crown, label: 'Premium Quality' },
                  { icon: Zap, label: 'Optimized for Pro' },
                ].map((feature, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 group">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary transition-colors group-hover:bg-primary/20">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <span className="font-semibold text-sm">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="container mx-auto px-4 py-20">
            <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-3xl font-bold font-headline">Trending Assets</h2>
                <p className="text-muted-foreground mt-1">Handpicked digital products gaining traction this week.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm">All</Button>
                <Button variant="ghost" size="sm">AI Prompts</Button>
                <Button variant="ghost" size="sm">UI Kits</Button>
                <Button variant="ghost" size="sm">Templates</Button>
              </div>
            </div>

            <ProductGrid products={products || []} loading={loading} />

            <div className="mt-16 text-center">
              <Link href="/products">
                <Button variant="link" size="lg" className="text-primary hover:text-accent font-semibold group">
                  View All Marketplace Items
                  <Search className="ml-2 h-4 w-4 transition-transform group-hover:scale-110" />
                </Button>
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
