'use client';

import { useState, useMemo, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

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

  const reviewsQuery = useMemoFirebase(() => {
    if (!db || !productId) return null;
    return query(
      collection(db, 'reviews'),
      where('productId', '==', productId)
    );
  }, [db, productId]);

  const { data: allReviews, loading } = useCollection(reviewsQuery);

  const processedReviews = useMemo(() => {
    if (!allReviews) return [];
    let result = allReviews.filter(r => r.isApproved !== false);
    if (starFilter !== null) {
      result = result.filter(r => r.rating === starFilter);
    }
    return result.sort((a: any, b: any) => {
      const dateA = a.createdAt?.toMillis?.() || 0;
      const dateB = b.createdAt?.toMillis?.() || 0;
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
    if (!db || !user) {
      toast({ title: "Sign in required", description: "Please login to leave a review." });
      return;
    }
    
    if (comment.length < 5) {
      toast({ variant: "destructive", title: "Review too short", description: "Please share a bit more about your experience." });
      return;
    }

    setIsSubmitting(true);
    const reviewData = {
      productId,
      productName,
      userId: user.uid,
      userName: user.displayName || 'Verified User',
      userAvatar: user.photoURL || '',
      rating,
      comment,
      isApproved: true,
      createdAt: serverTimestamp()
    };

    try {
      await addDoc(collection(db, 'reviews'), reviewData);

      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        const prodData = productSnap.data();
        const currentCount = prodData.reviewCount || 0;
        const currentAvg = prodData.averageRating || 5.0;
        const newCount = currentCount + 1;
        const newAvg = Number(((currentAvg * currentCount + rating) / newCount).toFixed(1));

        await updateDoc(productRef, {
          reviewCount: newCount,
          averageRating: newAvg,
          updatedAt: serverTimestamp()
        });
      }

      setComment('');
      setRating(5);
      toast({ title: "Review Shared", description: `Thank you for reviewing ${productName}!` });
    } catch (serverError: any) {
      const permissionError = new FirestorePermissionError({
        path: 'reviews',
        operation: 'create',
        requestResourceData: reviewData,
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
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
             <h3 className="text-xs font-black uppercase text-ghost-gray tracking-[0.2em]">Community Pulse</h3>
             <div className="flex items-center gap-4">
                <span className="text-5xl font-bold text-midnight-ink tracking-tighter">{stats.avg}</span>
                <div className="space-y-1">
                   <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={cn("h-4 w-4", s <= Math.round(Number(stats.avg)) ? "text-yellow-500 fill-current" : "text-stone-gray/30")} />
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-blue font-bold uppercase tracking-widest">Based on {stats.count} reviews</p>
                </div>
             </div>
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
                    starFilter === starLevel ? "opacity-100" : "opacity-60 hover:opacity-100"
                  )}
                >
                  <span className="text-[10px] font-bold text-midnight-ink w-4">{starLevel}</span>
                  <div className="flex-1 h-1.5 bg-powder-blue rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-deep-violet rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-blue font-mono w-8 text-right">{Math.round(percentage)}%</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Write Review */}
        <div className="flex-1 w-full">
           {user ? (
             <div className="p-8 rounded border border-stone-gray/10 bg-porcelain-white/50 space-y-6">
                <div className="space-y-1">
                   <h4 className="text-lg font-bold text-midnight-ink">Share your audit</h4>
                   <p className="text-slate-blue text-sm">How was your experience with this digital infrastructure?</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => !isSubmitting && setRating(star)}
                          onClick={() => setRating(star)}
                          className="transition-transform active:scale-90"
                          disabled={isSubmitting}
                        >
                          <Star className={cn(
                            "h-8 w-8 transition-colors", 
                            star <= rating ? "text-yellow-500 fill-current" : "text-stone-gray/20"
                          )} />
                        </button>
                      ))}
                    </div>

                    <Textarea 
                      placeholder="Write your technical review..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[120px] bg-white border-stone-gray/10 rounded focus:ring-deep-violet text-sm"
                      required
                      disabled={isSubmitting}
                    />

                    <Button type="submit" className="h-10 px-8 rounded bg-deep-violet font-bold gap-2" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Publish Review
                    </Button>
                </form>
             </div>
           ) : (
             <div className="p-12 text-center border border-dashed border-stone-gray/20 rounded bg-porcelain-white">
                <User className="h-8 w-8 text-ghost-gray mx-auto mb-4" />
                <p className="text-slate-blue text-sm mb-6">Sign in to contribute your experience to the community.</p>
                <Button variant="outline" className="h-10 px-8 rounded border-stone-gray/20" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
             </div>
           )}
        </div>
      </div>

      {/* Community Feed */}
      <div className="space-y-10">
        <div className="flex items-center justify-between border-b border-stone-gray/10 pb-4">
           <h3 className="text-xs font-black uppercase text-ghost-gray tracking-[0.2em] flex items-center gap-2">
             <MessageSquare className="h-4 w-4 text-deep-violet" />
             Community Log
           </h3>
           <div className="flex items-center gap-2">
              <Filter className="h-3 w-3 text-ghost-gray" />
              <span className="text-[10px] font-bold text-slate-blue uppercase">Filter:</span>
              {[5, 4, 3, 2, 1].map(s => (
                <button 
                  key={s} 
                  onClick={() => setStarFilter(starFilter === s ? null : s)}
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded border transition-all",
                    starFilter === s ? "bg-deep-violet border-deep-violet text-white" : "border-stone-gray/20 text-slate-blue hover:bg-powder-blue"
                  )}
                >
                  {s}★
                </button>
              ))}
           </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded" />)}
          </div>
        ) : processedReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {processedReviews.map((review: any) => (
              <div key={review.id} className="p-6 rounded border border-stone-gray/10 bg-white space-y-4 hover:border-deep-violet/30 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-stone-gray/10">
                      <AvatarImage src={review.userAvatar} />
                      <AvatarFallback className="bg-powder-blue text-deep-violet font-bold text-xs uppercase">
                        {review.userName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold text-midnight-ink flex items-center gap-1.5">
                        {review.userName}
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      </p>
                      <p className="text-[10px] text-ghost-gray uppercase font-bold tracking-tighter">
                        {review.createdAt ? format(new Date(review.createdAt.toDate()), 'MMM dd, yyyy') : 'RECENT'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn("h-3 w-3", i < review.rating ? "text-yellow-500 fill-current" : "text-stone-gray/20")} />
                    ))}
                  </div>
                </div>
                <p className="text-slate-blue text-sm leading-relaxed italic">
                  "{review.comment}"
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center text-slate-blue italic text-sm">
            No technical logs matching your current filter criteria.
          </div>
        )}
      </div>
    </div>
  );
}