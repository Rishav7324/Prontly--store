
'use client';

import { useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductGrid } from '@/components/store/ProductGrid';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, QueryConstraint } from 'firebase/firestore';
import { Filter, SlidersHorizontal, ChevronRight, LayoutGrid, List, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const searchQuery = searchParams.get('q');
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
    
    if (!searchQuery) {
      constraints.push(orderBy('createdAt', 'desc'));
    }
    
    return query(collection(db, 'products'), ...constraints);
  }, [db, categoryFilter, searchQuery]);

  const { data: products, loading } = useCollection(productsQuery);

  // Client-side filtering for search query
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchQuery) return products;
    
    const term = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.shortDescription?.toLowerCase().includes(term) ||
      p.tags?.some((t: string) => t.toLowerCase().includes(term))
    );
  }, [products, searchQuery]);

  return (
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
                  <span className="mr-2">{cat.iconEmoji}</span> {cat.name}
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
              {searchQuery && (
                <>
                  <ChevronRight className="h-3 w-3" />
                  <span className="italic">Search: "{searchQuery}"</span>
                </>
              )}
            </div>
            <h1 className="text-3xl font-bold font-headline">
              {searchQuery ? `Results for "${searchQuery}"` : (
                categoryFilter ? (
                  categories?.find((c: any) => c.slug === categoryFilter)?.name || categoryFilter
                ) : "All Marketplace Assets"
              )}
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

        <ProductGrid products={filteredProducts} loading={loading} />
        
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-muted/10 border-dashed border-2 rounded-3xl">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold">No assets found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
            <Button variant="link" asChild className="mt-4">
              <Link href="/products">View all products</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductListingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <Suspense fallback={
          <div className="flex flex-1 items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <MarketplaceContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
