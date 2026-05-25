'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Heart, ShoppingCart, Layers } from 'lucide-react';
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
    <Link href={`/products/${id}`} className="group block h-full">
      <Card className="h-full border-none bg-white rounded-[6px] overflow-hidden shadow-sm hover:shadow-xl-2 transition-all duration-300 hover:-translate-y-1 relative">
        <div className="relative aspect-[4/3] bg-porcelain-white overflow-hidden rounded-[4px] m-1">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            data-ai-hint="product digital asset"
          />
          
          {/* Top Overlays */}
          <div className="absolute top-3 left-3">
            <Badge className="bg-white/90 backdrop-blur-md text-midnight-ink border-none font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-[4px] shadow-sm">
              {category}
            </Badge>
          </div>

          <button 
            onClick={(e) => { e.preventDefault(); toggleItem(id); }}
            className={cn(
              "absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center transition-all shadow-sm border border-stone-gray/10 hover:scale-110 active:scale-90",
              isWishlisted ? "text-deep-violet" : "text-ghost-gray hover:text-midnight-ink"
            )}
          >
            <Heart className={cn("h-3.5 w-3.5", isWishlisted && "fill-current")} />
          </button>
        </div>

        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-blue uppercase tracking-wider">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-porcelain-white rounded-[4px] border border-stone-gray/10">
              <Star className="h-3 w-3 fill-deep-violet text-deep-violet" />
              <span className="text-midnight-ink">{rating}</span>
            </div>
            <div className="flex items-center gap-1 opacity-70">
               <Layers className="h-3 w-3" />
               <span>{sales} Users</span>
            </div>
          </div>

          <h3 className="text-base font-bold text-midnight-ink leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-deep-violet transition-colors">
            {title}
          </h3>

          <div className="flex items-center justify-between pt-4 border-t border-stone-gray/10">
            <div className="flex flex-col">
              <p className="text-lg font-bold text-midnight-ink tracking-tight">{price}</p>
              {compareAtPrice && compareAtPrice > priceRaw && (
                <span className="text-[10px] text-ghost-gray line-through decoration-deep-violet/30">₹{(compareAtPrice / 100).toLocaleString()}</span>
              )}
            </div>
            <Button 
              size="icon" 
              variant="default"
              className="h-10 w-10 rounded-[4px] bg-deep-violet text-white hover:opacity-90 transition-all shadow-sm"
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
