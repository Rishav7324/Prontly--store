'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ArrowRight, Heart, ShoppingCart } from 'lucide-react';
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
    addItem({ id, name: title, price: priceRaw, imageUrl, category });
    toast({ title: "Added to cart", description: `${title} is ready for checkout.` });
  };

  const isWishlisted = mounted ? isInWishlist(id) : false;

  return (
    <Link href={`/products/${id}`} className="group block">
      <Card className="h-full border-chalk bg-white rounded-2xl overflow-hidden hairline-shadow inset-detail transition-all duration-300 hover:border-obsidian">
        <div className="relative aspect-[4/5] bg-powder overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            data-ai-hint="product design"
          />
          <Badge className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm text-obsidian border-chalk font-medium text-[10px] uppercase tracking-widest px-3 py-1">
            {category}
          </Badge>
          <button 
            onClick={(e) => { e.preventDefault(); toggleItem(id); }}
            className={cn(
              "absolute top-4 right-4 h-9 w-9 rounded-full bg-white/80 backdrop-blur-sm border border-chalk flex items-center justify-center transition-all hover:bg-white",
              isWishlisted ? "text-red-500" : "text-gravel"
            )}
          >
            <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
          </button>
        </div>

        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between text-[11px] font-medium text-gravel uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <Star className="h-3 w-3 fill-current text-obsidian" />
              <span>{rating}</span>
            </div>
            <span>{sales} USERS</span>
          </div>

          <h3 className="text-xl font-headline text-obsidian leading-tight line-clamp-2">
            {title}
          </h3>

          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              {compareAtPrice && compareAtPrice > priceRaw && (
                <span className="text-xs text-gravel line-through">₹{(compareAtPrice / 100).toLocaleString()}</span>
              )}
              <p className="text-2xl font-medium text-obsidian">{price}</p>
            </div>
            <Button 
              size="icon" 
              className="h-10 w-10 bg-obsidian text-white"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}