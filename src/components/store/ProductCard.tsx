"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ShoppingCart, Layers, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { toast } from '@/hooks/use-toast';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
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

  const displayImages = images && images.length > 0 ? images : ['https://picsum.photos/seed/placeholder/600/800'];
  const productPath = `/products/${slug || id}`;

  return (
    <Card className="h-full border border-stone-gray/5 bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:border-primary/10 transition-all duration-500 group/card relative flex flex-col">
      <Link href={productPath} className="flex flex-col h-full">
        {/* MEDIA CONTAINER */}
        <div className="relative aspect-[4/5] bg-porcelain-white overflow-hidden m-2 rounded-[2rem]">
          {displayImages.length > 1 ? (
            <Carousel
              opts={{ align: "start", loop: true }}
              plugins={[Autoplay({ delay: 4000, stopOnInteraction: false })]}
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
                      sizes="(max-width: 768px) 50vw, 25vw"
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
              className="object-cover transition-transform duration-1000 group-hover/card:scale-110"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          )}
          
          <div className="absolute top-4 left-4 z-10">
            <Badge className="bg-white/90 backdrop-blur-xl text-midnight-ink border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
              {category}
            </Badge>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-midnight-ink/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
          
          {/* QUICK VIEW OVERLAY */}
          <div className="absolute bottom-4 left-4 right-4 translate-y-12 group-hover/card:translate-y-0 opacity-0 group-hover/card:opacity-100 transition-all duration-500 z-20">
             <div className="bg-white/90 backdrop-blur-xl p-3 rounded-2xl flex items-center justify-between border border-white/50 shadow-2xl">
                <span className="text-[10px] font-black uppercase text-ghost-gray tracking-widest pl-2">Full Specs</span>
                <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center text-white">
                   <ArrowUpRight className="h-4 w-4" />
                </div>
             </div>
          </div>
        </div>

        <CardContent className="p-6 pt-2 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-[10px] font-black text-slate-blue uppercase tracking-widest">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-porcelain-white rounded-full border border-stone-gray/10">
                <Star className="h-2.5 w-2.5 fill-primary text-primary" />
                <span className="text-midnight-ink font-headline">{rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1.5 opacity-60">
                 <Layers className="h-2.5 w-2.5" />
                 <span className="font-mono">{sales} Installs</span>
              </div>
            </div>

            <h3 className="text-lg font-bold text-midnight-ink leading-snug line-clamp-2 min-h-[3rem] group-hover/card:text-primary transition-colors">
              {title}
            </h3>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-stone-gray/5">
            <div className="flex flex-col">
              <p className="text-2xl font-bold text-midnight-ink font-headline tracking-tighter tabular-nums">{price}</p>
              {compareAtPrice && compareAtPrice > priceRaw && (
                <span className="text-[10px] text-ghost-gray font-headline line-through decoration-primary/30">
                  ₹{(compareAtPrice / 100).toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <Button 
              size="icon" 
              variant="default"
              className="h-12 w-12 rounded-2xl bg-primary text-white hover:bg-primary/90 transition-all shadow-xl shadow-primary/10 relative z-30 active:scale-90"
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