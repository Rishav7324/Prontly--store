'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, MessageSquare, Loader2, Send, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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

  const reviewsQuery = useMemoFirebase(() => {
    return db ? query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    ) : null;
  }, [db, productId]);

  const { data: reviews, loading } = useCollection(reviewsQuery);

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
        isApproved: true, // Simple MVP: auto-approve
        createdAt: serverTimestamp()
      });

      // Increment review count on product
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
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card/50 border border-white/5 rounded-3xl p-8 text-center space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Average Rating</h3>
            <div className="text-6xl font-bold font-headline">4.9</div>
            <div className="flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 text-yellow-500 fill-current" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{reviews?.length || 0} customer reviews</p>
          </div>

          {user && (
            <Card className="border-primary/20 bg-primary/5 rounded-3xl overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Share Your Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="transition-transform active:scale-90"
                      >
                        <Star className={cn("h-8 w-8 transition-colors", star <= rating ? "text-yellow-500 fill-current" : "text-muted-foreground")} />
                      </button>
                    ))}
                  </div>
                  <Textarea 
                    placeholder="What did you like about this asset?"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px] bg-background border-white/10"
                    required
                  />
                  <Button type="submit" className="w-full h-12 gap-2" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Post Review
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Reviews List */}
        <div className="lg:col-span-8 space-y-8">
          <h3 className="text-2xl font-bold font-headline flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-primary" />
            Verified Customer Stories
          </h3>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <div key={i} className="h-32 w-full animate-pulse bg-muted rounded-3xl" />)}
            </div>
          ) : reviews && reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review: any) => (
                <div key={review.id} className="p-8 rounded-3xl border border-white/5 bg-card/30 space-y-4 transition-all hover:bg-card/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={review.userAvatar} />
                        <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{review.userName}</span>
                          <Badge variant="secondary" className="text-[9px] bg-green-500/10 text-green-500 border-none px-1.5 py-0">Verified</Badge>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {review.createdAt ? format(new Date(review.createdAt.toDate()), 'MMM dd, yyyy') : 'Recently'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn("h-3 w-3", i < review.rating ? "text-yellow-500 fill-current" : "text-muted-foreground")} />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed italic">"{review.comment}"</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/10 border-dashed border-2 rounded-[2rem]">
              <p className="text-muted-foreground">Be the first to review this product!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
