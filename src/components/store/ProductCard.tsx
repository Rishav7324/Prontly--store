
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Heart, Download, ShieldCheck, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  reviewCount = 0,
  shortDescription,
  isFeatured
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
    toast({ title: "Added to cart", description: `${title} is ready for checkout.` });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(id);
  };

  const discountPercent = compareAtPrice && compareAtPrice > priceRaw 
    ? Math.round(((compareAtPrice - priceRaw) / compareAtPrice) * 100) 
    : null;

  const displayImages = images && images.length > 0 ? images : ['https://picsum.photos/seed/placeholder/600/800'];
  const productPath = `/products/${slug || id}`;

  return (
    <Card className="h-full w-full border border-stone-gray/10 bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all duration-500 group/card flex flex-col">
      <Link href={productPath} className="flex flex-col h-full">
        {/* MEDIA CONTAINER */}
        <div className="relative aspect-[4/5] bg-porcelain-white overflow-hidden">
          <Image
            src={displayImages[0]}
            alt={title}
            fill
            className="object-cover transition-transform duration-1000 group-hover/card:scale-110"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          
          {/* TOP OVERLAYS */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
            {isFeatured ? (
              <Badge className="bg-primary text-white border-none font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg shadow-lg">
                Bestseller
              </Badge>
            ) : discountPercent ? (
               <Badge className="bg-emerald-500 text-white border-none font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg shadow-lg">
                New
              </Badge>
            ) : (
               <Badge className="bg-blue-500 text-white border-none font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg shadow-lg">
                Popular
              </Badge>
            )}

            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-10 w-10 rounded-full bg-white/90 backdrop-blur-md shadow-xl transition-all hover:bg-white active:scale-90",
                mounted && isInWishlist(id) ? "text-rose-500" : "text-slate-400 hover:text-rose-500"
              )}
              onClick={handleWishlist}
            >
              <Heart className={cn("h-5 w-5", mounted && isInWishlist(id) && "fill-current")} />
            </Button>
          </div>

          {/* BOTTOM OVERLAYS */}
          {discountPercent && (
            <div className="absolute bottom-4 left-4 z-10">
              <div className="bg-primary/90 backdrop-blur-md text-white px-3 py-1 rounded-lg font-black text-xs shadow-xl">
                -{discountPercent}%
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-midnight-ink/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
        </div>

        <CardContent className="p-5 flex-1 flex flex-col space-y-4">
          {/* RATING & CATEGORY */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-bold text-midnight-ink">{rating.toFixed(1)}</span>
              <span className="text-xs text-ghost-gray">({reviewCount})</span>
            </div>
            <Badge variant="outline" className="text-[9px] font-black uppercase text-primary border-primary/20 bg-primary/5 tracking-wider">
              {category}
            </Badge>
          </div>

          {/* TITLE & DESCRIPTION */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-midnight-ink leading-tight line-clamp-1 group-hover/card:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-xs text-slate-blue line-clamp-2 leading-relaxed">
              {shortDescription || "Professional-grade digital asset optimized for performance and scale."}
            </p>
          </div>

          {/* FEATURE CHIPS */}
          <div className="flex flex-wrap gap-2 pt-1">
            <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-100 rounded-md">
              <Download className="h-3 w-3 text-slate-400" />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Instant Download</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-100 rounded-md">
              <ShieldCheck className="h-3 w-3 text-slate-400" />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Lifetime Access</span>
            </div>
          </div>

          {/* PRICE & ACTIONS */}
          <div className="flex items-center justify-between pt-4 mt-auto border-t border-stone-gray/5">
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-midnight-ink font-headline tabular-nums">
                ₹{(priceRaw / 100).toLocaleString('en-IN')}
              </p>
              {compareAtPrice && compareAtPrice > priceRaw && (
                <span className="text-sm text-ghost-gray line-through opacity-60">
                  ₹{(compareAtPrice / 100).toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <Button 
              size="icon" 
              className="h-10 w-10 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-90"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
