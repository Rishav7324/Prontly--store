
'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Trash2, 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  XCircle,
  MoreVertical,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function AdminReviewsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const db = useFirestore();

  const reviewsQuery = useMemoFirebase(() => {
    return db ? query(collection(db, 'reviews'), orderBy('createdAt', 'desc')) : null;
  }, [db]);

  const { data: reviews, loading } = useCollection(reviewsQuery);

  const filteredReviews = reviews?.filter(r => 
    r.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deleteReview = async (id: string) => {
    if (!db || !confirm('Permanently delete this review?')) return;
    try {
      await deleteDoc(doc(db, 'reviews', id));
      toast({ title: "Review Deleted", description: "The content has been removed." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete review." });
    }
  };

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    if (!db) return;
    await updateDoc(doc(db, 'reviews', id), { isApproved: !currentStatus });
    toast({ title: "Status Updated", description: `Review is now ${!currentStatus ? 'approved' : 'hidden'}.` });
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold font-headline">Review Moderation</h1>
        <p className="text-muted-foreground">Monitor and manage customer feedback across your store.</p>
      </header>

      <Card>
        <CardHeader className="p-4 border-b">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by customer, comment, or product..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 w-full animate-pulse bg-muted rounded" />
              ))}
            </div>
          ) : filteredReviews && filteredReviews.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review: any) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={review.userAvatar} />
                          <AvatarFallback>{review.userName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">{review.userName}</span>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">UID: {review.userId?.slice(-6)}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="font-bold text-sm">{review.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="space-y-1">
                        <p className="text-xs italic text-muted-foreground line-clamp-2">"{review.comment}"</p>
                        <Link href={`/products/${review.productId}`} className="text-[9px] text-primary font-bold uppercase hover:underline">
                          On: {review.productName || review.productId?.slice(-8)}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {review.createdAt ? format(new Date(review.createdAt.toDate()), 'MMM dd, HH:mm') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={review.isApproved !== false ? 'default' : 'secondary'}
                        className={review.isApproved !== false ? "bg-green-500/10 text-green-500 border-none" : ""}
                      >
                        {review.isApproved !== false ? 'Live' : 'Hidden'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Moderation</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => toggleApproval(review.id, review.isApproved !== false)}>
                            {review.isApproved !== false ? (
                              <><XCircle className="mr-2 h-4 w-4 text-destructive" /> Hide Review</>
                            ) : (
                              <><CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Approve Review</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/products/${review.productId}`} target="_blank">
                              <ExternalLink className="mr-2 h-4 w-4" /> View Product
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive focus:bg-destructive/10"
                            onClick={() => deleteReview(review.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-60 flex-col items-center justify-center text-center p-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-xl font-bold">No reviews found</h3>
              <p className="text-muted-foreground">As users leave feedback on products, it will appear here for your review.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
