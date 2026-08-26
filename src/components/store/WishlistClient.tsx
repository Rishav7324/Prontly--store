'use client';

import { useState, useEffect } from 'react';
import { ProductGrid } from '@/components/store/ProductGrid';
import { useWishlist } from '@/hooks/use-wishlist';
import { useQuery } from '@tanstack/react-query';
import { Heart, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function WishlistClient() {
  const { itemIds } = useWishlist();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const idsKey = mounted ? itemIds.join(',') : '';

  // Fetch wishlist products by ids — Neon via API
  const { data: products, isLoading: loading } = useQuery({
    queryKey: ['products', 'wishlist', idsKey],
    queryFn: async () => {
      const res = await fetch(`/api/products?ids=${encodeURIComponent(idsKey)}`);
      const json = await res.json();
      return json?.success ? (json.data as any[]) : [];
    },
    enabled: mounted && itemIds.length > 0,
  });

  if (!mounted) return null;

  return (
    <>
      <header className="mb-6 max-w-3xl">
        <div className="mb-3 flex items-center gap-2.5">
          <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-full bg-muted/50">
            <Link href="/products"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <Badge variant="outline" className="border-primary/30 px-2 py-0.5 text-[10px] font-medium text-primary">
            Personal Collection
          </Badge>
        </div>
        <h1 className="text-xl font-bold font-headline tracking-tight">Your Wishlist</h1>
        <p className="mt-1 text-xs text-muted-foreground">Saved assets waiting for your next project.</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <div className="space-y-6">
          <ProductGrid products={products} />
          <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-primary/10 bg-primary/5 p-5 text-center md:flex-row md:text-left">
            <div className="space-y-1">
              <h3 className="flex items-center justify-center gap-2 text-sm font-semibold font-headline md:justify-start">
                <Sparkles className="h-4 w-4 text-primary" />
                Ready to build?
              </h3>
              <p className="text-xs text-muted-foreground">Move your saved assets to the cart and start creating today.</p>
            </div>
            <Button className="h-10 w-full shrink-0 rounded-lg px-5 text-sm font-medium shadow-sm md:w-auto" asChild>
              <Link href="/checkout">Proceed to Checkout</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-4 rounded-xl border border-dashed border-stone-gray/20 bg-muted/5 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Heart className="h-5 w-5 text-muted-foreground opacity-40" />
          </div>
          <div className="space-y-1 px-4">
            <h2 className="text-lg font-semibold font-headline">Empty for now</h2>
            <p className="mx-auto max-w-xs text-xs text-muted-foreground">Explore our prompts and templates to fill your wishlist.</p>
          </div>
          <Button asChild className="h-10 rounded-lg px-6 text-sm font-medium shadow-sm">
            <Link href="/products">Browse Marketplace</Link>
          </Button>
        </div>
      )}
    </>
  );
}
