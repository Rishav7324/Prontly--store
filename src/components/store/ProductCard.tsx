
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Star, ArrowRight, Heart, ShoppingCart, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { toast } from '@/hooks/use-toast';

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

  return (
    <Link href={`/products/${id}`} className="group block h-full">
      <Card className="h-full overflow-hidden bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 border-white/5">
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            data-ai-hint="product image"
          />
          
          <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center gap-3">
            <Button size="icon" variant="secondary" className="rounded-full translate-y-4 transition-transform group-hover:translate-y-0 duration-300">
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              size="icon" 
              variant="primary" 
              className="rounded-full translate-y-4 transition-transform group-hover:translate-y-0 duration-300 delay-75"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>

          <Badge className="absolute right-3 top-3 bg-background/60 backdrop-blur-md text-foreground border-none font-medium text-[10px] uppercase tracking-wider">
            {category}
          </Badge>

          <button className="absolute left-3 top-3 h-8 w-8 rounded-full bg-background/60 backdrop-blur-md flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
            <Heart className="h-4 w-4" />
          </button>
        </div>

        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded">
              <Star className="h-2.5 w-2.5 fill-current" />
              <span className="font-bold">{rating}</span>
            </div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{sales} Sold</span>
          </div>

          <h3 className="font-headline font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>

          <div className="flex items-baseline justify-between">
            <p className="font-headline text-lg font-bold text-accent">
              {price}
            </p>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button variant="secondary" className="w-full text-xs h-9 gap-2 font-semibold">
            Details
            <ArrowRight className="h-3 w-3" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
