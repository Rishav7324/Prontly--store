"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Heart, Download, ShieldCheck } from 'lucide-react';
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
    toast({ title: "Added to cart", description: `${title} is ready.` });
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
    <Card className="h-full border border-stone-gray/10 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 group/card flex flex-col">
      <Link href={productPath} className="flex flex-col h-full">
        <div className="relative aspect-[4/5] bg-porcelain-white overflow-hidden">
          <Image
            src={displayImages[0]}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover/card:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
            <div className="flex flex-col gap-1.5">
              {isFeatured && (
                <Badge className="bg-primary text-white border-none font-bold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded shadow-sm w-fit">
                  Top Seller
                </Badge>
              )}
              {discountPercent && (
                <Badge className="bg-emerald-500 text-white border-none font-bold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded shadow-sm w-fit">
                  -{discountPercent}%
                </Badge>
              )}
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-8 w-8 rounded-full bg-white/80 backdrop-blur-md shadow-sm transition-all hover:bg-white active:scale-90",
                mounted && isInWishlist(id) ? "text-rose-500" : "text-slate-400"
              )}
              onClick={handleWishlist}
            >
              <Heart className={cn("h-4 w-4", mounted && isInWishlist(id) && "fill-current")} />
            </Button>
          </div>
        </div>

        <CardContent className="p-4 flex-1 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] font-bold text-midnight-ink">{rating.toFixed(1)}</span>
            </div>
            <span className="text-[8px] font-black uppercase text-primary/60 tracking-widest">
              {category}
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-bold text-midnight-ink leading-tight line-clamp-1 group-hover/card:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-[11px] text-slate-blue line-clamp-2 leading-relaxed opacity-80">
              {shortDescription || "Technical digital asset engineered for scale."}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded">
              <Download className="h-2.5 w-2.5 text-slate-400" />
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Instant</span>
            </div>
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 border border-slate-100 rounded">
              <ShieldCheck className="h-2.5 w-2.5 text-slate-400" />
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Verified</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 mt-auto border-t border-stone-gray/5">
            <div className="flex items-center gap-1.5">
              <p className="text-base font-bold text-midnight-ink font-headline tabular-nums">
                ₹{(priceRaw / 100).toLocaleString('en-IN')}
              </p>
            </div>
            <Button 
              size="icon" 
              className="h-8 w-8 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all shadow-sm active:scale-90"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}