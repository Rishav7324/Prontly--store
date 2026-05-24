'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ArrowRight, Heart, ShoppingCart, Eye, Zap, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { useWishlist } from '@/hooks/use-wishlist';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  id: string;
  title: string;
  price: string;
  priceRaw: number;
  compareAtPrice?: number;
  category: string;
  imageUrl: string;
  rating: number;
  sales: string;
}

export function ProductCard({ id, title, price, priceRaw, compareAtPrice, category, imageUrl, rating, sales }: ProductCardProps) {
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id,
      name: title,
      price: priceRaw,
      imageUrl,
      category
    });
    toast({
      title: "Added to cart",
      description: `${title} is ready for checkout.`,
    });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(id);
    const isAdded = !isInWishlist(id);
    toast({
      title: isAdded ? "Added to wishlist" : "Removed from wishlist",
      description: isAdded ? (
        <div className="flex flex-col gap-2">
          <span>{title} saved for later.</span>
          <Link href="/wishlist" className="text-xs font-bold underline text-primary">View Wishlist</Link>
        </div>
      ) : `${title} removed.`,
    });
  };

  const isWishlisted = mounted ? isInWishlist(id) : false;
  const isSale = compareAtPrice && compareAtPrice > priceRaw;
  const discountPercent = isSale ? Math.round(((compareAtPrice - priceRaw) / compareAtPrice) * 100) : 0;

  return (
    <Link href={`/products/${id}`} className="group block h-full">
      <Card className="h-full overflow-hidden bg-card/40 backdrop-blur-xl transition-all duration-500 hover:border-primary/50 hover:shadow-[0_30px_60px_rgba(0,0,0,0.5)] hover:scale-[1.02] border-white/10 rounded-[1.5rem] sm:rounded-[2.5rem] relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative aspect-[4/5] overflow-hidden m-2 sm:m-3 rounded-[1.25rem] sm:rounded-[2rem]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent)] z-10" />
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-1000 group-hover:scale-110"
            data-ai-hint="product image"
          />
          
          <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center gap-2 sm:gap-3 z-20">
            <Button 
              size="icon" 
              variant="secondary" 
              className="rounded-full h-10 w-10 sm:h-12 sm:w-12 translate-y-8 transition-all group-hover:translate-y-0 duration-500 ease-out bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20"
            >
              <Eye className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
            <Button 
              size="icon" 
              className="rounded-full h-10 w-10 sm:h-12 sm:w-12 translate-y-8 transition-all group-hover:translate-y-0 duration-500 delay-100 ease-out bg-primary hover:bg-primary/80 text-white border-none shadow-[0_10px_30px_rgba(91,82,214,0.4)]"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>

          <Badge className="absolute right-3 top-3 sm:right-5 sm:top-5 bg-black/40 backdrop-blur-md text-white border border-white/10 font-bold text-[8px] sm:text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-lg z-20">
            {category}
          </Badge>

          {isSale && (
            <Badge className="absolute left-3 bottom-3 sm:left-5 sm:bottom-5 bg-green-500 text-white border-none font-bold text-[8px] sm:text-[10px] uppercase tracking-widest px-2 py-1 rounded-lg shadow-xl z-20 animate-in fade-in slide-in-from-left-4 duration-700">
              <Zap className="h-3 w-3 mr-1 fill-current" />
              {discountPercent}% OFF
            </Badge>
          )}

          <button 
            onClick={handleWishlist}
            className={cn(
              "absolute left-3 top-3 sm:left-5 sm:top-5 h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center transition-all duration-300 z-20 border border-white/10",
              isWishlisted ? "text-red-500 border-red-500/30 bg-red-500/10" : "text-white/70 hover:text-red-500 hover:bg-white/10"
            )}
          >
            <Heart className={cn("h-4 w-4 sm:h-5 sm:w-5", isWishlisted && "fill-current")} />
          </button>
        </div>

        <CardContent className="p-4 sm:p-7 space-y-3 sm:space-y-5 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[11px] text-yellow-500 font-bold bg-yellow-500/5 px-2 py-0.5 rounded-full border border-yellow-500/10">
              <Star className="h-3 w-3 fill-current" />
              <span className="text-foreground">{rating}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] sm:text-[11px] text-muted-foreground font-bold uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>{sales} USERS</span>
            </div>
          </div>

          <h3 className="font-headline font-bold text-base sm:text-xl leading-tight line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem] sm:min-h-[3.5rem]">
            {title}
          </h3>

          <div className="flex items-end justify-between pt-2">
            <div className="flex flex-col gap-1">
              {isSale && (
                <span className="text-[10px] sm:text-xs text-muted-foreground line-through font-medium opacity-50">
                  ₹{(compareAtPrice / 100).toLocaleString('en-IN')}
                </span>
              )}
              <p className="font-headline text-xl sm:text-3xl font-bold text-accent tracking-tight">
                {price}
              </p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:shadow-[0_0_20px_rgba(91,82,214,0.3)] transition-all duration-500">
              <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground group-hover:text-white transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
