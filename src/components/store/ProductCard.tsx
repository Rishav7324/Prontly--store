"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Heart, Package } from 'lucide-react';
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
  shortDescription,
  isFeatured,
}: ProductCardProps) {
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ id, name: title, price: priceRaw, imageUrl: images[0] || '', category });
    toast({ title: 'Added to cart', description: title });
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
    <Link href={`/products/${slug || id}`} className="block group/card min-w-0">
      <div className="rounded-lg border border-border/60 bg-white overflow-hidden shadow-sm transition-all duration-200 hover:border-accent/30 hover:shadow-md flex flex-col h-full">
        {/* Image */}
        <div className="relative aspect-[3/4] bg-muted/40 overflow-hidden">
          {images?.[0] ? (
            <Image
              src={images[0]}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover/card:scale-[1.03]"
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/20">
              <Package className="h-8 w-8 text-muted-foreground/20" />
            </div>
          )}
          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            {discount && (
              <span className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                −{discount}%
              </span>
            )}
            {isFeatured && (
              <span className="bg-zinc-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Featured</span>
            )}
          </div>
          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            aria-label="Toggle wishlist"
            className={cn(
              'absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center transition-all active:scale-90 hover:bg-white',
              mounted && isInWishlist(id) ? 'text-rose-500' : 'text-slate-400'
            )}
          >
            <Heart className={cn('h-3.5 w-3.5', mounted && isInWishlist(id) && 'fill-current')} />
          </button>
        </div>

        {/* Content */}
        <div className="p-3 flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-1 gap-2">
            <span className="text-[10px] font-medium text-accent uppercase tracking-wide truncate">{category}</span>
            <span className="flex items-center gap-0.5 shrink-0">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-[10px] font-semibold tabular-nums">{rating.toFixed(1)}</span>
            </span>
          </div>
          <h3 className="text-xs font-semibold leading-snug line-clamp-2 group-hover/card:text-accent transition-colors break-words">
            {title}
          </h3>
          {shortDescription && (
            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 break-words">{shortDescription}</p>
          )}

          <div className="flex items-center justify-between mt-auto pt-2.5 gap-2">
            <div className="min-w-0 flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm font-bold tabular-nums">₹{(priceRaw / 100).toLocaleString('en-IN')}</span>
              {compareAtPrice && compareAtPrice > priceRaw && (
                <span className="text-[10px] text-muted-foreground line-through tabular-nums">
                  ₹{(compareAtPrice / 100).toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <Button
              size="icon"
              className="h-7 w-7 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white shrink-0"
              onClick={handleAddToCart}
              aria-label="Add to cart"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
