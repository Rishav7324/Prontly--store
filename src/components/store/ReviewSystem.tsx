
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
  Sparkles
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
      orderBy('createdAt', 'desc')
    );
  }, [db, productId]);

  const { data: allReviews, loading } = useCollection(reviewsQuery);

  // Stats calculation
  const stats = useMemo(() => {
    if (!allReviews || allReviews.length === 0) return { avg: 0, count: 0, distribution: [0, 0, 0, 0, 0] };
    
    const count = allReviews.length;
    const distribution = [0, 0, 0, 0, 0]; // 1, 2, 3, 4, 5 stars
    let totalSum = 0;

    allReviews.forEach(r => {
      totalSum += r.rating;
      distribution[r.rating - 1]++;
    });

    return {
      avg: (totalSum / count).toFixed(1),
      count,
      distribution: distribution.reverse() // [5, 4, 3, 2, 1]
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

      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        reviewCount: increment(1)
      });

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
    <div className="space-y-16">
      {/* 1. Review Summary & Action Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-8">
          <section className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="text-6xl font-bold font-headline text-foreground">{stats.avg}</div>
              <div className="space-y-1">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn("h-5 w-5", s <= Math.round(Number(stats.avg)) ? "text-yellow-500 fill-current" : "text-muted-foreground/30")} />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground font-medium">Based on {stats.count} reviews</p>
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
                      "w-full group flex items-center gap-4 text-sm transition-all p-1 rounded-lg hover:bg-white/5",
                      starFilter === starLevel && "bg-white/5 ring-1 ring-white/10"
                    )}
                  >
                    <span className="w-12 text-left font-bold text-muted-foreground group-hover:text-foreground">{starLevel} stars</span>
                    <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 rounded-full transition-all duration-1000" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-muted-foreground font-mono">{Math.round(percentage)}%</span>
                  </button>
                );
              })}
            </div>
          </section>

          {user ? (
            <Card className="border-primary/20 bg-primary/5 rounded-[2rem] overflow-hidden shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Write a Review</CardTitle>
                <CardDescription>Share your honest experience with the community.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => !isSubmitting && setRating(star)}
                          onClick={() => setRating(star)}
                          className="transition-transform active:scale-90 hover:scale-110 disabled:opacity-50"
                          disabled={isSubmitting}
                        >
                          <Star className={cn(
                            "h-10 w-10 transition-colors duration-200", 
                            star <= rating ? "text-yellow-500 fill-current" : "text-muted-foreground/20"
                          )} />
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                      {['Poor', 'Fair', 'Good', 'Excellent', 'Exceptional'][rating - 1]}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <Textarea 
                      placeholder="What makes this asset special? (Min. 5 characters)"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[120px] bg-background border-white/5 rounded-2xl focus:ring-primary focus:border-primary resize-none"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full h-12 gap-2 rounded-xl text-lg font-bold" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    {isSubmitting ? "Syncing..." : "Post Review"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-muted/10 border-dashed border-2 p-8 text-center rounded-[2rem]">
              <p className="text-muted-foreground mb-4">Own this asset? Sign in to leave your feedback.</p>
              <Button variant="outline" className="rounded-full px-8" asChild>
                <a href="/login">Sign In</a>
              </Button>
            </Card>
          )}
        </div>

        <div className="lg:col-span-8 space-y-12">
          {/* 2. Spotlight Carousel (Auto-swipe) */}
          {allReviews && allReviews.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-headline">Review Spotlight</h3>
                    <p className="text-xs text-muted-foreground">What people are talking about</p>
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
                <CarouselContent className="-ml-4">
                  {allReviews.map((review: any) => (
                    <CarouselItem key={review.id} className="pl-4 md:basis-1/2 lg:basis-1/2">
                      <Card className="h-full bg-card/40 border-white/5 rounded-[2rem] p-8 space-y-6 transition-all hover:bg-card/60 hover:border-primary/20">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={cn("h-3 w-3", i < review.rating ? "text-yellow-500 fill-current" : "text-muted-foreground/20")} />
                            ))}
                          </div>
                          <Quote className="h-6 w-6 text-primary/10" />
                        </div>
                        
                        <p className="text-sm italic leading-relaxed text-foreground/90 line-clamp-4 min-h-[5rem]">
                          "{review.comment}"
                        </p>

                        <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                          <Avatar className="h-8 w-8 border border-white/10">
                            <AvatarImage src={review.userAvatar} />
                            <AvatarFallback className="text-[10px]">{review.userName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate">{review.userName}</p>
                            <div className="flex items-center gap-1 text-green-500 text-[8px] font-bold uppercase tracking-widest">
                              <CheckCircle2 className="h-2 w-2" /> Verified
                            </div>
                          </div>
                        </div>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="hidden md:flex justify-end gap-2 mt-4">
                  <CarouselPrevious className="relative left-0 top-0 translate-y-0 h-10 w-10 border-white/10 bg-white/5 hover:bg-primary" />
                  <CarouselNext className="relative right-0 top-0 translate-y-0 h-10 w-10 border-white/10 bg-white/5 hover:bg-primary" />
                </div>
              </Carousel>
            </section>
          )}

          {/* 3. Detailed Review List & Filtering */}
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
              <h3 className="text-2xl font-bold font-headline flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-primary" />
                Community Feed
              </h3>
              
              <div className="flex flex-wrap gap-2">
                {starFilter !== null && (
                  <Badge 
                    variant="secondary" 
                    className="gap-2 px-3 py-1 cursor-pointer bg-primary/20 text-primary border-none"
                    onClick={() => setStarFilter(null)}
                  >
                    {starFilter} Stars <X className="h-3 w-3" />
                  </Badge>
                )}
                {[5, 4, 3, 2, 1].map((star) => {
                  const hasReviews = stats.distribution[5-star] > 0;
                  if (!hasReviews && starFilter !== star) return null;
                  return (
                    <button
                      key={star}
                      onClick={() => setStarFilter(starFilter === star ? null : star)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all",
                        starFilter === star 
                          ? "bg-primary border-primary text-white" 
                          : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                      )}
                    >
                      {star}★
                    </button>
                  );
                })}
              </div>
            </div>

            {loading ? (
              <div className="space-y-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-40 w-full animate-pulse bg-muted rounded-[2rem]" />
                ))}
              </div>
            ) : filteredReviews.length > 0 ? (
              <div className="space-y-6">
                {filteredReviews.map((review: any) => (
                  <div 
                    key={review.id} 
                    className="p-8 rounded-[2rem] border border-white/5 bg-card/30 space-y-6 transition-all hover:bg-card/50 hover:border-primary/20 animate-in fade-in slide-in-from-bottom-2 duration-500"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarImage src={review.userAvatar} />
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {review.userName?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base text-foreground">{review.userName}</span>
                            <Badge variant="secondary" className="text-[9px] bg-green-500/10 text-green-500 border-none px-2 py-0 font-bold uppercase tracking-widest">
                              <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Verified
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Reviewed {review.createdAt ? format(new Date(review.createdAt.toDate()), 'MMMM dd, yyyy') : 'Recently'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={cn("h-3 w-3", i < review.rating ? "text-yellow-500 fill-current" : "text-muted-foreground/20")} />
                        ))}
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed italic text-lg pl-2 border-l-2 border-primary/20">
                      "{review.comment}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-muted/5 border-dashed border-2 rounded-[3rem] border-white/5">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h4 className="text-xl font-bold font-headline mb-2">No matching reviews</h4>
                <p className="text-muted-foreground">Be the first to share your thoughts on this asset.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
