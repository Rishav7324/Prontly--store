'use client';

import { useState, useMemo } from 'react';
import { useUser, useAuth } from '@/firebase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Star, 
  MessageSquare, 
  Loader2, 
  Send, 
  CheckCircle2, 
  X, 
  Quote,
  Sparkles,
  Filter,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ReviewSystemProps {
  productId: string;
  productName: string;
}

export function ReviewSystem({ productId, productName }: ReviewSystemProps) {
  const { user } = useUser();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [starFilter, setStarFilter] = useState<number | null>(null);

  // Reviews feed — Neon via API, polled every 15s
  const { data: allReviews, isLoading: loading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const res = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`);
      const json = await res.json();
      return json?.success ? (json.data as any[]) : [];
    },
    refetchInterval: 15000,
    enabled: !!productId,
  });

  const processedReviews = useMemo(() => {
    if (!allReviews) return [];
    let result = allReviews.filter(r => r.isApproved !== false);
    if (starFilter !== null) {
      result = result.filter(r => r.rating === starFilter);
    }
    return result.sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [allReviews, starFilter]);

  const stats = useMemo(() => {
    if (!allReviews || allReviews.length === 0) return { avg: 0, count: 0, distribution: [0, 0, 0, 0, 0] };
    const approvedReviews = allReviews.filter(r => r.isApproved !== false);
    const count = approvedReviews.length;
    const distribution = [0, 0, 0, 0, 0];
    let totalSum = 0;

    approvedReviews.forEach(r => {
      totalSum += r.rating;
      const index = Math.min(Math.max(1, r.rating), 5) - 1;
      distribution[index]++;
    });

    return {
      avg: count > 0 ? (totalSum / count).toFixed(1) : 0,
      count,
      distribution: [...distribution].reverse()
    };
  }, [allReviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Sign in required", description: "Please login to leave a review." });
      return;
    }
    
    if (comment.length < 5) {
      toast({ variant: "destructive", title: "Review too short", description: "Please share a bit more about your experience." });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          productId,
          userId: user.uid,
          userName: user.displayName || 'Verified User',
          userAvatar: user.photoURL || '',
          rating,
          comment,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Failed to publish review');
      }

      // Product rating is recomputed server-side; refresh the feed
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });

      setComment('');
      setRating(5);
      toast({ title: "Review Shared", description: `Thank you for reviewing ${productName}!` });
    } catch {
      toast({ variant: "destructive", title: "Review failed", description: "Something went wrong while publishing your review. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-16">
      <div className="flex flex-col md:flex-row gap-16 items-start">
        {/* Left: Summary */}
        <div className="w-full md:w-80 space-y-8">
          <div className="space-y-2">
             <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer Reviews</h3>
             {stats.count > 0 ? (
               <div className="flex items-center gap-4">
                  <span className="text-4xl font-extrabold text-foreground font-headline tracking-tight">{stats.avg}</span>
                  <div className="space-y-1">
                     <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={cn("h-4 w-4", s <= Math.round(Number(stats.avg)) ? "text-amber-400 fill-amber-400" : "text-border")} />
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-semibold">Based on {stats.count} {stats.count === 1 ? 'review' : 'reviews'}</p>
                  </div>
               </div>
             ) : (
               <div className="py-2">
                 <p className="text-sm font-semibold text-foreground">No customer reviews yet</p>
                 <p className="text-xs text-muted-foreground mt-0.5">Be the first to share your thoughts after purchasing.</p>
               </div>
             )}
          </div>

          <div className="space-y-2">
            {stats.distribution.map((count, i) => {
              const starLevel = 5 - i;
              const percentage = stats.count > 0 ? (count / stats.count) * 100 : 0;
              return (
                <button 
                  key={starLevel}
                  onClick={() => setStarFilter(starFilter === starLevel ? null : starLevel)}
                  className={cn(
                    "w-full group flex items-center gap-4 py-1.5 transition-all text-left",
                    starFilter === starLevel ? "opacity-100" : "opacity-70 hover:opacity-100"
                  )}
                >
                  <span className="text-xs font-bold text-foreground w-4">{starLevel}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono w-8 text-right font-medium">{Math.round(percentage)}%</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Write Review */}
        <div className="flex-1 w-full">
           {user ? (
             <div className="p-6 sm:p-8 rounded-2xl border border-border/80 bg-card shadow-xs space-y-5">
                <div className="space-y-1">
                   <h4 className="text-base font-bold text-foreground">Share your feedback</h4>
                   <p className="text-muted-foreground text-xs">How was your experience with this asset?</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                   <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => !isSubmitting && setRating(star)}
                          onClick={() => setRating(star)}
                          className="transition-transform active:scale-90 p-1"
                          disabled={isSubmitting}
                        >
                          <Star className={cn(
                            "h-7 w-7 transition-colors", 
                            star <= rating ? "text-amber-400 fill-amber-400" : "text-border"
                          )} />
                        </button>
                      ))}
                    </div>

                    <Textarea 
                      placeholder="Write your review..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[110px] bg-background border-border rounded-xl text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-accent"
                      required
                      disabled={isSubmitting}
                    />

                    <Button type="submit" className="h-10 px-6 rounded-xl bg-zinc-950 text-white hover:bg-zinc-800 font-bold text-xs gap-2 shadow-xs" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Publish Review
                    </Button>
                </form>
             </div>
           ) : (
             <div className="p-8 sm:p-12 text-center border border-dashed border-border rounded-2xl bg-muted/20">
                <User className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-60" />
                <p className="text-foreground text-xs sm:text-sm font-semibold mb-4">Sign in to leave a verified customer review.</p>
                <Button variant="outline" className="h-9 px-6 rounded-xl border-border/80 text-xs font-semibold" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
             </div>
           )}
        </div>
      </div>

      {/* Community Feed */}
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
           <h3 className="text-xs font-bold uppercase text-foreground tracking-wider flex items-center gap-2">
             <MessageSquare className="h-4 w-4 text-accent" />
             Verified Reviews ({processedReviews.length})
           </h3>
           <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Filter className="h-3 w-3 text-muted-foreground" />
                <span className="text-[11px] font-bold text-muted-foreground uppercase whitespace-nowrap">Filter:</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[5, 4, 3, 2, 1].map(s => (
                  <button 
                    key={s} 
                    onClick={() => setStarFilter(starFilter === s ? null : s)}
                    className={cn(
                      "text-xs font-bold px-2.5 py-1 rounded-lg border transition-all min-w-[36px] text-center",
                      starFilter === s ? "bg-zinc-950 border-zinc-950 text-white" : "border-border/80 text-foreground bg-white hover:bg-muted"
                    )}
                  >
                    {s}★
                  </button>
                ))}
              </div>
           </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
          </div>
        ) : processedReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {processedReviews.map((review: any) => (
              <div key={review.id} className="p-5 rounded-2xl border border-border/70 bg-card space-y-3 hover:border-border transition-all shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-border/60">
                      <AvatarImage src={review.userAvatar} />
                      <AvatarFallback className="bg-muted text-foreground font-bold text-xs uppercase">
                        {review.userName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                        {review.userName}
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        {review.createdAt ? format(new Date(review.createdAt), 'dd MMM yyyy') : 'Recent'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn("h-3.5 w-3.5", i < review.rating ? "text-amber-400 fill-amber-400" : "text-border")} />
                    ))}
                  </div>
                </div>
                <p className="text-foreground/90 text-xs sm:text-sm leading-relaxed">
                  "{review.comment}"
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground text-xs sm:text-sm">
            No reviews matching your filter.
          </div>
        )}
      </div>
    </div>
  );
}
