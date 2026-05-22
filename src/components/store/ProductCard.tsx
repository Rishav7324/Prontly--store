'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, ArrowRight, Heart, ShoppingCart, Eye } from 'lucide-react';
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
  category: string;
  imageUrl: string;
  rating: number;
  sales: string;
}

export function ProductCard({ id, title, price, priceRaw, category, imageUrl, rating, sales }: ProductCardProps) {
  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();

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
      description: `${title} has been added to your shopping cart.`,
    });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(id);
    const isAdded = !isInWishlist(id);
    toast({
      title: isAdded ? "Added to wishlist" : "Removed from wishlist",
      description: isAdded ? `${title} saved for later.` : `${title} removed.`,
    });
  };

  return (
    <Link href={`/products/${id}`} className="group block h-full">
      <Card className="h-full overflow-hidden bg-card transition-all duration-500 hover:border-primary/50 hover:shadow-[0_20px_50px_rgba(85,78,210,0.15)] border-white/5 rounded-[2rem]">
        <div className="relative aspect-[4/5] overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            data-ai-hint="product image"
          />
          
          <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center gap-3">
            <Button size="icon" variant="secondary" className="rounded-full translate-y-6 transition-transform group-hover:translate-y-0 duration-500 ease-out bg-white/10 backdrop-blur-md border-none text-white hover:bg-white/20">
              <Eye className="h-5 w-5" />
            </Button>
            <Button 
              size="icon" 
              className="rounded-full translate-y-6 transition-transform group-hover:translate-y-0 duration-500 delay-100 ease-out bg-primary hover:bg-primary/80 text-white border-none shadow-lg"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </div>

          <Badge className="absolute right-4 top-4 bg-background/60 backdrop-blur-md text-foreground border-none font-bold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg">
            {category}
          </Badge>

          <button 
            onClick={handleWishlist}
            className={cn(
              "absolute left-4 top-4 h-9 w-9 rounded-xl bg-background/60 backdrop-blur-md flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100",
              isInWishlist(id) ? "text-red-500 opacity-100 scale-100" : "text-muted-foreground hover:text-red-500"
            )}
          >
            <Heart className={cn("h-4 w-4", isInWishlist(id) && "fill-current")} />
          </button>
        </div>

        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-yellow-500 font-bold">
              <Star className="h-3 w-3 fill-current" />
              <span>{rating}</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">{sales} SALES</span>
          </div>

          <h3 className="font-headline font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors min-h-[3.5rem]">
            {title}
          </h3>

          <div className="flex items-center justify-between pt-2">
            <p className="font-headline text-2xl font-bold text-accent">
              {price}
            </p>
            <div className="h-8 w-8 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-300">
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
