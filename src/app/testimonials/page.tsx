
'use client';

import { useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, Quote, Heart, Sparkles, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function TestimonialsPage() {
  const db = useFirestore();

  const testimonialsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'reviews'),
      where('rating', '>=', 4),
      orderBy('rating', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [db]);

  const { data: reviews, loading } = useCollection(testimonialsQuery);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-20">
        <header className="max-w-3xl mb-20">
          <Badge variant="outline" className="mb-6 border-primary/50 text-primary py-1 px-4 text-sm font-medium rounded-full bg-primary/5">
            <Sparkles className="h-3 w-3 mr-2" />
            Verified Customer Stories
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold font-headline mb-8 leading-tight">
            The Wall of <span className="text-primary">Love.</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Join thousands of professional creators who have accelerated their workflow with Prontly's digital assets. Here's what our community has to say.
          </p>
        </header>

        {loading ? (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-60 w-full bg-muted animate-pulse rounded-[2.5rem]" />
            ))}
          </div>
        ) : reviews && reviews.length > 0 ? (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
            {reviews.map((review: any) => (
              <Card 
                key={review.id} 
                className="break-inside-avoid bg-card/40 border-white/5 rounded-[2.5rem] p-8 transition-all hover:border-primary/20 hover:bg-card/60 group"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn("h-3 w-3", i < review.rating ? "text-yellow-500 fill-current" : "text-muted-foreground/20")} />
                      ))}
                    </div>
                    <Quote className="h-8 w-8 text-primary/10 group-hover:text-primary/20 transition-colors" />
                  </div>

                  <p className="text-lg leading-relaxed text-foreground/90 italic">
                    "{review.comment}"
                  </p>

                  <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                    <Avatar className="h-10 w-10 border border-primary/20">
                      <AvatarImage src={review.userAvatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">{review.userName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm truncate">{review.userName}</span>
                        <Badge className="bg-green-500/10 text-green-500 border-none text-[8px] uppercase tracking-widest px-1.5 py-0">Verified</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                        {review.createdAt ? format(new Date(review.createdAt.toDate()), 'MMM dd, yyyy') : 'Recent'}
                      </p>
                    </div>
                  </div>

                  {review.productName && (
                    <Link 
                      href={`/products/${review.productId}`}
                      className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-accent transition-colors"
                    >
                      <ShoppingBag className="h-3 w-3" />
                      View Asset: {review.productName}
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-40 bg-muted/5 border-dashed border-2 rounded-[3rem] border-white/5">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h4 className="text-xl font-bold">No reviews yet</h4>
            <p className="text-muted-foreground">Be the first to share your experience on our product pages!</p>
          </div>
        )}

        <section className="mt-32 pt-20 border-t border-white/5 text-center">
          <h2 className="text-3xl font-bold font-headline mb-6">Ready to create something great?</h2>
          <Link 
            href="/products" 
            className="inline-flex h-14 items-center justify-center rounded-2xl bg-primary px-10 text-lg font-bold text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all"
          >
            Explore the Marketplace
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
