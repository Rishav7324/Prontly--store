
"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, ArrowRight, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  id: string;
  title: string;
  price: string;
  category: string;
  imageUrl: string;
  rating: number;
  sales: string;
}

export function ProductCard({ id, title, price, category, imageUrl, rating, sales }: ProductCardProps) {
  return (
    <Link href={`/products/${id}`}>
      <Card className="group overflow-hidden bg-card transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10">
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            data-ai-hint="product image"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <Badge className="absolute right-3 top-3 bg-background/60 backdrop-blur-md text-foreground">
            {category}
          </Badge>
        </div>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1 text-xs text-yellow-500">
              <Star className="h-3 w-3 fill-current" />
              <span>{rating}</span>
            </div>
            <span className="text-xs text-muted-foreground">{sales} sales</span>
          </div>
          <h3 className="font-headline font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="mt-2 font-headline text-xl font-bold text-accent">
            {price}
          </p>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button variant="secondary" className="w-full group/btn flex items-center justify-center gap-2">
            View Details
            <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
