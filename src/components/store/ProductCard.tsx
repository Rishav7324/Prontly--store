"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Heart, Package, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  id: string;
  slug?: string;
  title: string;
  price: string;
  priceRaw: number;
  compareAtPrice?: number;
  category: string;
  images: string[];
  rating: number;
  reviewCount?: number;
  shortDescription?: string;
  isFeatured?: boolean;
}

export function ProductCard({
  id,
  slug,
  title,
  price,
  priceRaw,
  compareAtPrice,
  category,
  images,
  rating,
  reviewCount,
  shortDescription,
  isFeatured,
}: ProductCardProps) {
  const { addItem, items } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const [mounted, setMounted] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isItemInCart = mounted && items.some((item) => item.id === id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ id, name: title, price: priceRaw, imageUrl: images[0] || '', category });
    setJustAdded(true);
    toast({ title: 'Added to cart', description: title });
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(id);
  };

  const discount =
    compareAtPrice && compareAtPrice > priceRaw
      ? Math.round(((compareAtPrice - priceRaw) / compareAtPrice) * 100)
      : null;

  return (
    <Link href={`/products/${slug || id}`} className="group/card block h-full min-w-0 select-none">
      <div className="relative flex flex-col h-full rounded-2xl border border-border/70 bg-white shadow-xs transition-all duration-300 hover:border-accent/40 hover:shadow-lg hover:-translate-y-1 overflow-hidden">
        {/* Media Container */}
        <div className="relative aspect-[4/3] sm:aspect-[3/4] w-full bg-muted/40 overflow-hidden">
          {images?.[0] ? (
            <Image
              src={images[0]}
              alt={title}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20 text-muted-foreground/30">
              <Package className="h-8 w-8 mb-1" />
              <span className="text-[10px] font-medium">Digital Asset</span>
            </div>
          )}

          {/* Top Gradient Overlay */}
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 z-10">
            {discount && (
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs tracking-tight">
                −{discount}%
              </span>
            )}
            {isFeatured && (
              <span className="bg-zinc-950/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs tracking-tight">
                Featured
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={handleWishlist}
            aria-label="Toggle wishlist"
            className={cn(
              'absolute top-2.5 right-2.5 h-8 w-8 rounded-full bg-white/90 backdrop-blur-md shadow-sm flex items-center justify-center transition-all duration-200 active:scale-75 hover:bg-white hover:shadow-md z-10',
              mounted && isInWishlist(id) ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'
            )}
          >
            <Heart className={cn('h-4 w-4 transition-transform', mounted && isInWishlist(id) && 'fill-current scale-110')} />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between min-w-0 bg-white">
          <div>
            {/* Header info */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent truncate">
                {category}
              </span>
              {reviewCount && reviewCount > 0 ? (
                <div className="flex items-center gap-1 shrink-0 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="text-[10px] font-bold text-amber-900 tabular-nums">
                    {rating ? rating.toFixed(1) : '5.0'}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Title */}
            <h3 className="text-xs sm:text-sm font-semibold leading-snug line-clamp-2 text-foreground group-hover/card:text-accent transition-colors break-words">
              {title}
            </h3>

            {/* Description */}
            {shortDescription && (
              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-1 break-words">
                {shortDescription}
              </p>
            )}
          </div>

          {/* Bottom Price & Action Row */}
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-border/50 gap-2">
            <div className="min-w-0 flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-bold tabular-nums text-foreground tracking-tight">
                ₹{(priceRaw / 100).toLocaleString('en-IN')}
              </span>
              {compareAtPrice && compareAtPrice > priceRaw && (
                <span className="text-[11px] text-muted-foreground/80 line-through tabular-nums">
                  ₹{(compareAtPrice / 100).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Add to Cart button */}
            <Button
              type="button"
              size="icon"
              className={cn(
                'h-8 w-8 rounded-xl shrink-0 transition-all duration-200 active:scale-90 shadow-xs',
                justAdded
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : isItemInCart
                  ? 'bg-accent hover:bg-accent/90 text-white'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-white'
              )}
              onClick={handleAddToCart}
              aria-label={isItemInCart ? "In cart" : "Add to cart"}
            >
              {justAdded ? (
                <Check className="h-4 w-4 animate-in zoom-in" />
              ) : (
                <ShoppingCart className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
