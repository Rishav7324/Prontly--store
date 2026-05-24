'use client';

import { useMemo, useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductGrid } from '@/components/store/ProductGrid';
import { useWishlist } from '@/hooks/use-wishlist';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, documentId } from 'firebase/firestore';
import { Heart, ArrowLeft, ShoppingBag, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function WishlistPage() {
  const { itemIds } = useWishlist();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const wishlistQuery = useMemoFirebase(() => {
    if (!db || !itemIds || itemIds.length === 0) return null;
    // Firestore IN query limits to 30 items, perfect for a wishlist MVP
    return query(collection(db, 'products'), where(documentId(), 'in', itemIds.slice(0, 30)));
  }, [db, itemIds]);

  const { data: products, loading } = useCollection(wishlistQuery);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-16">
        <header className="max-w-3xl mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="icon" asChild className="rounded-full bg-white/5 h-10 w-10">
              <Link href="/products"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <Badge variant="outline" className="border-primary/50 text-primary uppercase tracking-widest px-3 py-1 font-bold text-[10px]">
              Personal Collection
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-headline leading-tight">Your Wishlist.</h1>
          <p className="text-lg md:text-xl text-muted-foreground mt-2">Saved assets waiting to elevate your next project.</p>
        </header>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 sm:h-80 bg-muted animate-pulse rounded-[1.5rem] sm:rounded-[2rem]" />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="space-y-12">
            <ProductGrid products={products} />
            <div className="p-6 sm:p-10 rounded-[2rem] sm:rounded-[3rem] bg-primary/5 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold font-headline flex items-center justify-center md:justify-start gap-3">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  Ready to build?
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">Move your saved assets to the cart and start creating today.</p>
              </div>
              <Button size="lg" className="w-full md:w-auto rounded-2xl px-10 h-14 font-bold shadow-xl shadow-primary/20" asChild>
                <Link href="/checkout">Proceed to Checkout</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-20 sm:py-32 flex flex-col items-center justify-center text-center space-y-8 bg-muted/5 border-dashed border-2 border-white/5 rounded-[2.5rem] sm:rounded-[4rem]">
            <div className="h-20 w-20 sm:h-24 sm:w-24 bg-white/5 rounded-full flex items-center justify-center">
              <Heart className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground opacity-20" />
            </div>
            <div className="space-y-2 px-4">
              <h2 className="text-2xl sm:text-3xl font-bold font-headline">Empty for now</h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto">Explore our high-performance prompts and templates to fill your wishlist.</p>
            </div>
            <Button asChild size="lg" className="rounded-2xl h-14 px-12 font-bold shadow-lg">
              <Link href="/products">Browse Marketplace</Link>
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
