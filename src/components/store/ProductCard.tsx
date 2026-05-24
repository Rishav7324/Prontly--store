'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ArrowRight, Heart, ShoppingCart, Eye, Zap } from 'lucide-react';
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
      <Card className="h-full overflow-hidden bg-card transition-all duration-500 hover:border-primary/50 hover:shadow-[0_20px_50px_rgba(85,78,210,0.15)] border-white/5 rounded-[1.5rem] sm:rounded-[2rem]">
        <div className="relative aspect-[4/5] overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            data-ai-hint="product image"
          />
          
          <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center gap-2 sm:gap-3">
            <Button size="icon" variant="secondary" className="rounded-full h-8 w-8 sm:h-10 sm:w-10 translate-y-6 transition-transform group-hover:translate-y-0 duration-500 ease-out bg-white/10 backdrop-blur-md border-none text-white hover:bg-white/20">
              <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button 
              size="icon" 
              className="rounded-full h-8 w-8 sm:h-10 sm:w-10 translate-y-6 transition-transform group-hover:translate-y-0 duration-500 delay-100 ease-out bg-primary hover:bg-primary/80 text-white border-none shadow-lg"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>

          <Badge className="absolute right-2 top-2 sm:right-4 sm:top-4 bg-background/60 backdrop-blur-md text-foreground border-none font-bold text-[8px] sm:text-[9px] uppercase tracking-widest px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg">
            {category}
          </Badge>

          {isSale && (
            <Badge className="absolute right-2 bottom-2 sm:right-4 sm:bottom-4 bg-green-500 text-white border-none font-bold text-[8px] sm:text-[10px] uppercase tracking-widest px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg shadow-lg">
              <Zap className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 fill-current" />
              {discountPercent}% OFF
            </Badge>
          )}

          <button 
            onClick={handleWishlist}
            className={cn(
              "absolute left-2 top-2 sm:left-4 sm:top-4 h-7 w-7 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl bg-background/60 backdrop-blur-md flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100",
              isWishlisted ? "text-red-500 opacity-100 scale-100" : "text-muted-foreground hover:text-red-500"
            )}
          >
            <Heart className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isWishlisted && "fill-current")} />
          </button>
        </div>

        <CardContent className="p-3 sm:p-6 space-y-2 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[8px] sm:text-[10px] text-yellow-500 font-bold">
              <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-current" />
              <span>{rating}</span>
            </div>
            <span className="text-[8px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{sales} SALES</span>
          </div>

          <h3 className="font-headline font-bold text-sm sm:text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem] sm:min-h-[3.5rem]">
            {title}
          </h3>

          <div className="flex items-center justify-between pt-1 sm:pt-2">
            <div className="flex flex-col">
              {isSale && (
                <span className="text-[10px] sm:text-xs text-muted-foreground line-through font-medium mb-0.5">
                  ₹{(compareAtPrice / 100).toLocaleString('en-IN')}
                </span>
              )}
              <p className="font-headline text-lg sm:text-2xl font-bold text-accent">
                {price}
              </p>
            </div>
            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300">
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground group-hover:text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
