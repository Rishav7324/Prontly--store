'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { Plus, Check, ShoppingBag, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/use-cart';
import { toast } from '@/hooks/use-toast';

interface BundleUpsellProps {
  currentProduct: any;
}

export function BundleUpsell({ currentProduct }: BundleUpsellProps) {
  const { addItem } = useCart();

  const { data: allProducts = [] } = useQuery({
    queryKey: ['bundle-products'],
    queryFn: async () => {
      const res = await fetch('/api/products');
      const json = await res.json();
      return json.success ? json.data : [];
    },
    staleTime: 60000,
  });

  // Pick 1 complementary product from same or popular category (excluding current)
  const complementaryProduct = useMemo(() => {
    if (!allProducts.length) return null;
    const candidates = (allProducts as any[]).filter(p => p.id !== currentProduct.id && p.slug !== currentProduct.slug);
    if (!candidates.length) return null;
    // Prefer same category if available
    const sameCat = candidates.find(p => p.categorySlug === currentProduct.categorySlug);
    return sameCat || candidates[0];
  }, [allProducts, currentProduct]);

  if (!complementaryProduct) return null;

  const currentPrice = currentProduct.price / 100;
  const compPrice = complementaryProduct.price / 100;
  const originalTotal = currentPrice + compPrice;
  const bundleDiscount = 0.15; // 15% off bundle
  const discountedTotal = Math.round(originalTotal * (1 - bundleDiscount));
  const savings = originalTotal - discountedTotal;

  const handleAddBundle = () => {
    addItem({
      id: currentProduct.id,
      name: currentProduct.name,
      price: currentProduct.price,
      imageUrl: currentProduct.images?.[0] || 'https://picsum.photos/seed/placeholder/100/100',
      category: currentProduct.categorySlug || 'Asset',
    });

    addItem({
      id: complementaryProduct.id,
      name: complementaryProduct.name,
      price: complementaryProduct.price,
      imageUrl: complementaryProduct.images?.[0] || 'https://picsum.photos/seed/placeholder/100/100',
      category: complementaryProduct.categorySlug || 'Asset',
    });

    toast({
      title: "Bundle Added to Cart!",
      description: `Added "${currentProduct.name}" + "${complementaryProduct.name}" to cart.`,
    });
  };

  return (
    <div className="rounded-3xl border border-border/80 bg-gradient-to-br from-white via-zinc-50/50 to-amber-50/30 p-5 sm:p-6 shadow-xs space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm sm:text-base font-bold font-headline text-foreground">
            Frequently Bought Together
          </h3>
        </div>
        <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/20 border-amber-300/40 text-[10px] font-extrabold uppercase tracking-wider">
          Save 15%
        </Badge>
      </div>

      {/* Product Cards Stack */}
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
        
        {/* Item 1: Current */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-border/60 shadow-2xs w-full sm:w-1/2">
          <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-muted border border-border/60 shrink-0">
            <Image
              src={currentProduct.images?.[0] || 'https://picsum.photos/seed/placeholder/100/100'}
              alt={currentProduct.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-accent uppercase">This Item</span>
            <p className="text-xs font-bold text-foreground line-clamp-1">{currentProduct.name}</p>
            <p className="text-xs font-extrabold text-foreground font-headline">₹{currentPrice.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border/60">
          <Plus className="h-3.5 w-3.5" />
        </div>

        {/* Item 2: Complementary */}
        <Link href={`/products/${complementaryProduct.slug}`} className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-border/60 shadow-2xs w-full sm:w-1/2 hover:border-accent/40 transition-colors">
          <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-muted border border-border/60 shrink-0">
            <Image
              src={complementaryProduct.images?.[0] || 'https://picsum.photos/seed/placeholder/100/100'}
              alt={complementaryProduct.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">{complementaryProduct.categorySlug || 'Companion'}</span>
            <p className="text-xs font-bold text-foreground line-clamp-1">{complementaryProduct.name}</p>
            <p className="text-xs font-extrabold text-foreground font-headline">₹{compPrice.toLocaleString('en-IN')}</p>
          </div>
        </Link>

      </div>

      {/* Bundle Pricing & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/60">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-medium text-muted-foreground">Bundle Total:</span>
            <span className="text-lg font-extrabold text-foreground font-headline">
              ₹{discountedTotal.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-muted-foreground line-through">
              ₹{originalTotal.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[11px] font-bold text-emerald-600">You save ₹{savings.toLocaleString('en-IN')} with this combo</p>
        </div>

        <Button
          onClick={handleAddBundle}
          className="h-10 rounded-2xl px-5 text-xs font-bold bg-zinc-950 text-white hover:bg-zinc-800 shadow-md active:scale-[0.98] transition-all"
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          Add Both to Cart
        </Button>
      </div>

    </div>
  );
}
