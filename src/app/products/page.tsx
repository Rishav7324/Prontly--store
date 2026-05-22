'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductGrid } from '@/components/store/ProductGrid';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, QueryConstraint } from 'firebase/firestore';
import { Filter, SlidersHorizontal, ChevronRight, LayoutGrid, List } from 'lucide-react';
import Link from 'next/link';

export default function ProductListingPage() {
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const db = useFirestore();
  
  // Fetch Categories for Sidebar
  const categoriesQuery = useMemoFirebase(() => {
    return db ? collection(db, 'categories') : null;
  }, [db]);
  const { data: categories } = useCollection(categoriesQuery);

  // Fetch Products with optional filtering
  const productsQuery = useMemoFirebase(() => {
    if (!db) return null;
    const constraints: QueryConstraint[] = [where('isPublished', '==', true)];
    
    if (categoryFilter) {
      constraints.push(where('categorySlug', '==', categoryFilter));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));
    return query(collection(db, 'products'), ...constraints);
  }, [db, categoryFilter]);

  const { data: products, loading } = useCollection(productsQuery);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="flex flex-col gap-8 md:flex-row">
          
          {/* Sidebar / Filters */}
          <aside className="w-full md:w-64 space-y-8 flex-shrink-0">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Categories</h3>
              <div className="space-y-1">
                <Button 
                  asChild 
                  variant={!categoryFilter ? "secondary" : "ghost"} 
                  className="w-full justify-start font-medium"
                >
                  <Link href="/products">All Assets</Link>
                </Button>
                {categories?.map((cat: any) => (
                  <Button 
                    key={cat.id}
                    asChild 
                    variant={categoryFilter === cat.slug ? "secondary" : "ghost"} 
                    className="w-full justify-start font-medium"
                  >
                    <Link href={`/products?category=${cat.slug}`}>
                      {cat.iconEmoji} {cat.name}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <h4 className="font-bold mb-2">Need a custom prompt?</h4>
                <p className="text-sm text-muted-foreground mb-4">Our experts can build tailored AI solutions for your business.</p>
                <Button variant="link" className="p-0 text-primary h-auto">Contact Sales</Button>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1 space-y-8">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Link href="/" className="hover:text-foreground">Home</Link>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-foreground font-medium">Marketplace</span>
                  {categoryFilter && (
                    <>
                      <ChevronRight className="h-3 w-3" />
                      <span className="capitalize">{categoryFilter}</span>
                    </>
                  )}
                </div>
                <h1 className="text-3xl font-bold font-headline">
                  {categoryFilter ? (
                    categories?.find((c: any) => c.slug === categoryFilter)?.name || categoryFilter
                  ) : "All Marketplace Assets"}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Sort
                </Button>
                <div className="hidden sm:flex border rounded-md overflow-hidden">
                  <Button variant="ghost" size="icon" className="rounded-none bg-muted"><LayoutGrid className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-none"><List className="h-4 w-4" /></Button>
                </div>
              </div>
            </header>

            <ProductGrid products={products || []} loading={loading} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
