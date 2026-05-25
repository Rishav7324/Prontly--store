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
      <Card className="h-full border-none bg-secondary/50 rounded-md overflow-hidden stripe-shadow-sm transition-all duration-300 hover:stripe-shadow hover:-translate-y-1">
        <div className="relative aspect-[16/10] bg-muted overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            data-ai-hint="product design"
          />
          <Badge className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-foreground border-none font-bold text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-sm">
            {category}
          </Badge>
          <button 
            onClick={(e) => { e.preventDefault(); toggleItem(id); }}
            className={cn(
              "absolute top-3 right-3 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center transition-all hover:bg-white",
              isWishlisted ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
          </button>
        </div>

        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-primary text-primary" />
              <span className="text-foreground">{rating}</span>
            </div>
            <span>{sales} USERS</span>
          </div>

          <h3 className="text-base font-bold text-foreground leading-snug line-clamp-1">
            {title}
          </h3>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-bold text-foreground">{price}</p>
              {compareAtPrice && compareAtPrice > priceRaw && (
                <span className="text-xs text-muted-foreground line-through decoration-primary/30">₹{(compareAtPrice / 100).toLocaleString()}</span>
              )}
            </div>
            <Button 
              size="icon" 
              variant="outline"
              className="h-8 w-8 rounded bg-white text-primary border-primary/20 hover:bg-primary hover:text-white"
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
