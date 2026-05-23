'use client';

import { useState, useMemo, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Star, 
  MessageSquare, 
  Loader2, 
  Send, 
  CheckCircle2, 
  X, 
  Quote,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

interface ReviewSystemProps {
  productId: string;
  productName: string;
}

export function ReviewSystem({ productId, productName }: ReviewSystemProps) {
  const { user } = useUser();
  const db = useFirestore();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [starFilter, setStarFilter] = useState<number | null>(null);
  
  const plugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  const reviewsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      where('isApproved', '==', true),
      orderBy('createdAt', 'desc')
    );
  }, [db, productId]);

  const { data: allReviews, loading } = useCollection(reviewsQuery);

  // Stats calculation
  const stats = useMemo(() => {
    if (!allReviews || allReviews.length === 0) return { avg: 0, count: 0, distribution: [0, 0, 0, 0, 0] };
    
    const count = allReviews.length;
    const distribution = [0, 0, 0, 0, 0]; // index 0=1star, 4=5star
    let totalSum = 0;

    allReviews.forEach(r => {
      totalSum += r.rating;
      const index = Math.min(Math.max(1, r.rating), 5) - 1;
      distribution[index]++;
    });

    return {
      avg: (totalSum / count).toFixed(1),
      count,
      distribution: [...distribution].reverse() // [5, 4, 3, 2, 1]
    };
  }, [allReviews]);

  const filteredReviews = useMemo(() => {
    if (!allReviews) return [];
    if (starFilter === null) return allReviews;
    return allReviews.filter(r => r.rating === starFilter);
  }, [allReviews, starFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) {
      toast({ title: "Sign in required", description: "Please login to leave a review." });
      return;
    }
    
    if (comment.length < 5) {
      toast({ variant: "destructive", title: "Review too short", description: "Please share a bit more about your experience." });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId,
        userId: user.uid,
        userName: user.displayName || 'Verified User',
        userAvatar: user.photoURL || '',
        rating,
        comment,
        isApproved: true,
        createdAt: serverTimestamp()
      });

      // Optimistically update product counters if possible
      const productRef = doc(db, 'products', productId);
      updateDoc(productRef, {
        reviewCount: increment(1)
      }).catch(() => {}); // Non-blocking

      setComment('');
      setRating(5);
      toast({ title: "Review Shared", description: `Thank you for reviewing ${productName}!` });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not post review." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-20">
      {/* 1. Review Summary Dashboard */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold font-headline">Customer Satisfaction</h3>
            <div className="flex items-center gap-6">
              <div className="text-7xl font-bold font-headline text-foreground">{stats.avg}</div>
              <div className="space-y-1">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn("h-5 w-5", s <= Math.round(Number(stats.avg)) ? "text-yellow-500 fill-current" : "text-muted-foreground/30")} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground font-medium">Based on {stats.count} verified reviews</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {stats.distribution.map((count, i) => {
              const starLevel = 5 - i;
              const percentage = stats.count > 0 ? (count / stats.count) * 100 : 0;
              return (
                <button 
                  key={starLevel}
                  onClick={() => setStarFilter(starFilter === starLevel ? null : starLevel)}
                  className={cn(
                    "w-full group flex items-center gap-4 text-sm transition-all p-2 rounded-xl hover:bg-white/5",
                    starFilter === starLevel && "bg-primary/10 ring-1 ring-primary/20"
                  )}
                >
                  <div className="flex items-center gap-1 w-14 shrink-0">
                    <span className="font-bold text-muted-foreground group-hover:text-foreground">{starLevel}</span>
                    <Star className="h-3 w-3 fill-current text-yellow-500" />
                  </div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-muted-foreground font-mono text-xs">{Math.round(percentage)}%</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-8">
          {user ? (
            <Card className="border-primary/20 bg-primary/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-headline">Share Your Experience</CardTitle>
                <CardDescription>Your feedback helps other creators make informed decisions.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex flex-col items-center sm:items-start gap-4">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => !isSubmitting && setRating(star)}
                          onClick={() => setRating(star)}
                          className="transition-all active:scale-90 hover:scale-125 disabled:opacity-50"
                          disabled={isSubmitting}
                        >
                          <Star className={cn(
                            "h-12 w-12 transition-colors duration-200", 
                            star <= rating ? "text-yellow-500 fill-current" : "text-muted-foreground/20"
                          )} />
                        </button>
                      ))}
                    </div>
                    <Badge variant="outline" className="bg-background text-primary border-primary/20 font-bold uppercase tracking-widest text-[10px] px-3 py-1">
                      {['Poor', 'Fair', 'Good', 'Excellent', 'Exceptional'][rating - 1]} Experience
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <Textarea 
                      placeholder="What did you like about this asset? How did it improve your workflow?"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[140px] bg-background border-white/5 rounded-[1.5rem] focus:ring-primary focus:border-primary resize-none text-lg"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full sm:w-auto px-10 h-14 gap-3 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    {isSubmitting ? "Submitting..." : "Post My Review"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted/10 border-dashed border-2 p-12 text-center rounded-[2.5rem] flex flex-col items-center justify-center space-y-6">
              <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center">
                <Star className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div className="max-w-xs mx-auto">
                <p className="text-muted-foreground font-medium">Have you used this asset? Sign in to share your thoughts with the community.</p>
              </div>
              <Button size="lg" className="rounded-full px-12" asChild>
                <a href="/login">Sign In to Review</a>
              </Button>
            </Card>
          )}
        </div>
      </section>

      {/* 2. Spotlight Carousel */}
      {allReviews && allReviews.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shadow-lg shadow-accent/10">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-3xl font-bold font-headline">Review Highlights</h3>
                <p className="text-muted-foreground">What our power users are saying</p>
              </div>
            </div>
          </div>

          <Carousel
            plugins={[plugin.current]}
            className="w-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
            opts={{
              align: "start",
              loop: true,
            }}
          >
            <CarouselContent className="-ml-6">
              {allReviews.map((review: any) => (
                <CarouselItem key={review.id} className="pl-6 md:basis-1/2 lg:basis-1/3">
                  <Card className="h-full bg-card/60 backdrop-blur-md border-white/5 rounded-[2.5rem] p-10 space-y-8 transition-all hover:bg-card/80 hover:border-primary/30 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Quote className="h-20 w-20 text-primary" />
                    </div>
                    
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn("h-4 w-4", i < review.rating ? "text-yellow-500 fill-current" : "text-muted-foreground/20")} />
                      ))}
                    </div>
                    
                    <p className="text-lg italic leading-relaxed text-foreground/90 line-clamp-5 min-h-[7rem]">
                      "{review.comment}"
                    </p>

                    <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                      <Avatar className="h-12 w-12 border-2 border-primary/20">
                        <AvatarImage src={review.userAvatar} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{review.userName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{review.userName}</p>
                        <div className="flex items-center gap-1 text-green-500 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                          <CheckCircle2 className="h-3 w-3" /> Verified
                        </div>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-end gap-3 mt-8">
              <CarouselPrevious className="relative left-0 top-0 translate-y-0 h-12 w-12 border-white/10 bg-white/5 hover:bg-primary hover:text-white" />
              <CarouselNext className="relative right-0 top-0 translate-y-0 h-12 w-12 border-white/10 bg-white/5 hover:bg-primary hover:text-white" />
            </div>
          </Carousel>
        </section>
      )}

      {/* 3. Detailed Community Feed */}
      <section className="space-y-10 pt-10 border-t border-white/5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <MessageSquare className="h-5 w-5" />
            </div>
            <h3 className="text-3xl font-bold font-headline">Community Feed</h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-2 flex items-center gap-2">
              <Filter className="h-3 w-3" /> Filter By:
            </span>
            {starFilter !== null && (
              <Button 
                variant="secondary" 
                size="sm"
                className="rounded-full gap-2 bg-primary/20 text-primary hover:bg-primary/30"
                onClick={() => setStarFilter(null)}
              >
                {starFilter} Stars <X className="h-3.5 w-3.5" />
              </Button>
            )}
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                onClick={() => setStarFilter(starFilter === star ? null : star)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold border transition-all",
                  starFilter === star 
                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                    : "bg-white/5 border-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground"
                )}
              >
                {star} ★
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="h-48 w-full animate-pulse bg-muted rounded-[2.5rem]" />
            ))}
          </div>
        ) : filteredReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredReviews.map((review: any) => (
              <div 
                key={review.id} 
                className="p-8 rounded-[2.5rem] border border-white/5 bg-card/30 space-y-6 transition-all hover:bg-card/50 hover:border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-primary/20">
                      <AvatarImage src={review.userAvatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                        {review.userName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-foreground">{review.userName}</span>
                        <Badge className="bg-green-500/10 text-green-500 border-none px-2 py-0 text-[8px] font-bold uppercase tracking-widest">
                          <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Verified
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                        {review.createdAt ? format(new Date(review.createdAt.toDate()), 'MMMM dd, yyyy') : 'Recently'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn("h-3.5 w-3.5", i < review.rating ? "text-yellow-500 fill-current" : "text-muted-foreground/20")} />
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <p className="text-muted-foreground leading-relaxed text-lg pl-6 border-l-2 border-primary/30 py-1">
                    "{review.comment}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-40 bg-muted/5 border-dashed border-2 rounded-[3rem] border-white/10">
            <Star className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-10" />
            <h4 className="text-2xl font-bold font-headline mb-2">No reviews match your criteria</h4>
            <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">Be the first to share your unique experience and help the community grow.</p>
            {starFilter !== null && (
              <Button variant="link" className="mt-4 text-primary font-bold" onClick={() => setStarFilter(null)}>
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
