'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ArrowRight, Heart, ShoppingCart, ArrowUpRight } from 'lucide-react';
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
      <Card className="h-full border-none bg-white rounded-md overflow-hidden shadow-sm hover:shadow-xl-2 transition-all duration-500 hover:-translate-y-1 relative">
        <div className="relative aspect-[16/10] bg-powder-blue overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-[1500ms] group-hover:scale-110 group-hover:rotate-1"
            data-ai-hint="product design"
          />
          
          {/* Top Overlays */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <Badge className="bg-white/95 backdrop-blur-md text-midnight-ink border border-stone-gray/10 font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-sm shadow-sm">
              {category}
            </Badge>
            <button 
              onClick={(e) => { e.preventDefault(); toggleItem(id); }}
              className={cn(
                "h-9 w-9 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center transition-all shadow-sm border border-stone-gray/10 hover:scale-110 active:scale-90",
                isWishlisted ? "text-deep-violet" : "text-ghost-gray hover:text-midnight-ink"
              )}
            >
              <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
            </button>
          </div>

          {/* Hover Action */}
          <div className="absolute inset-0 bg-deep-violet/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-xl translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <ArrowUpRight className="h-6 w-6 text-deep-violet" />
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between text-[10px] font-black text-ghost-gray uppercase tracking-[0.15em]">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-porcelain-white rounded border border-stone-gray/10">
              <Star className="h-3 w-3 fill-deep-violet text-deep-violet" />
              <span className="text-midnight-ink font-bold">{rating}</span>
            </div>
            <span className="flex items-center gap-1">
               <Layers className="h-3 w-3" />
               {sales} USERS
            </span>
          </div>

          <h3 className="text-lg font-bold text-midnight-ink leading-snug line-clamp-2 min-h-[3.5rem] group-hover:text-deep-violet transition-colors">
            {title}
          </h3>

          <div className="flex items-center justify-between pt-4 border-t border-stone-gray/10">
            <div className="flex flex-col">
              <p className="text-2xl font-bold text-midnight-ink tracking-tight">{price}</p>
              {compareAtPrice && compareAtPrice > priceRaw && (
                <span className="text-xs text-ghost-gray line-through decoration-deep-violet/30">₹{(compareAtPrice / 100).toLocaleString()}</span>
              )}
            </div>
            <Button 
              size="icon" 
              variant="outline"
              className="h-11 w-11 rounded-md bg-porcelain-white text-deep-violet border-stone-gray/10 hover:bg-deep-violet hover:text-white transition-all shadow-sm"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
