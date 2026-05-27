'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

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
  sales: string;
}

export function ProductCard({ id, slug, title, price, priceRaw, compareAtPrice, category, images, rating, sales }: ProductCardProps) {
  const { addItem } = useCart();
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

  const displayImages = images && images.length > 0 ? images : ['https://picsum.photos/seed/placeholder/600/400'];
  const productPath = `/products/${slug || id}`;

  return (
    <Card className="h-full border-none bg-white rounded-[6px] overflow-hidden shadow-sm hover:shadow-xl-2 transition-all duration-300 hover:-translate-y-1 relative group/card">
      <Link href={productPath} className="block h-full">
        <div className="relative aspect-[4/5] bg-porcelain-white overflow-hidden rounded-[4px] m-1">
          {displayImages.length > 1 ? (
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 3000,
                  stopOnInteraction: false,
                }),
              ]}
              className="w-full h-full"
            >
              <CarouselContent className="-ml-0 h-full">
                {displayImages.map((img, index) => (
                  <CarouselItem key={index} className="pl-0 relative aspect-[4/5] h-full">
                    <Image
                      src={img}
                      alt={`${title} - image ${index + 1}`}
                      fill
                      className="object-cover"
                      data-ai-hint="product digital asset"
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          ) : (
            <Image
              src={displayImages[0]}
              alt={title}
              fill
              className="object-cover transition-transform duration-700 group-hover/card:scale-105"
              data-ai-hint="product digital asset"
            />
          )}
          
          {/* Top Overlays */}
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <Badge className="bg-white/90 backdrop-blur-md text-midnight-ink border-none font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-[4px] shadow-sm">
              {category}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-blue uppercase tracking-wider">
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-porcelain-white rounded-[3px] border border-stone-gray/10">
              <Star className="h-2.5 w-2.5 fill-deep-violet text-deep-violet" />
              <span className="text-midnight-ink">{rating}</span>
            </div>
            <div className="flex items-center gap-1 opacity-70">
               <Layers className="h-2.5 w-2.5" />
               <span>{sales} Users</span>
            </div>
          </div>

          <h3 className="text-sm font-bold text-midnight-ink leading-tight line-clamp-2 min-h-[2.25rem] group-hover/card:text-deep-violet transition-colors">
            {title}
          </h3>

          <div className="flex items-center justify-between pt-3 border-t border-stone-gray/10">
            <div className="flex flex-col">
              <p className="text-base font-bold text-midnight-ink tracking-tight">{price}</p>
              {compareAtPrice && compareAtPrice > priceRaw && (
                <span className="text-[9px] text-ghost-gray line-through decoration-deep-violet/30">₹{(compareAtPrice / 100).toLocaleString()}</span>
              )}
            </div>
            <Button 
              size="icon" 
              variant="default"
              className="h-8 w-8 rounded-[4px] bg-deep-violet text-white hover:opacity-90 transition-all shadow-sm relative z-20"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
