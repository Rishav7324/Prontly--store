'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Search, 
  Trash2, 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  XCircle,
  MoreVertical,
  ExternalLink
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
    <div className="space-y-4">
      <header>
        <h1 className="text-lg md:text-xl font-semibold">Reviews</h1>
        <p className="text-xs text-muted-foreground">Monitor and manage customer feedback across your store.</p>
      </header>

      <Card className="rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search by customer, comment, or product..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 rounded-lg"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse bg-muted rounded-lg" />
              ))}
            </div>
          ) : filteredReviews && filteredReviews.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="pl-4">Customer</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review: any) => (
                    <TableRow key={review.id}>
                      <TableCell className="pl-4 px-3 py-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-7 w-7 border">
                            <AvatarImage src={review.userAvatar} />
                            <AvatarFallback className="text-xs">{review.userName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium leading-none">{review.userName}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">UID: …{review.userId?.slice(-6)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="text-xs font-medium">{review.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs px-3 py-2">
                        <div className="space-y-0.5">
                          <p className="text-xs italic text-muted-foreground line-clamp-2">&quot;{review.comment}&quot;</p>
                          <Link href={`/products/${review.productId}`} className="text-[10px] text-primary font-medium hover:underline line-clamp-1 block max-w-[200px]">
                            On: {review.productName || review.productId?.slice(-8)}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-[10px] text-muted-foreground whitespace-nowrap">
                        {review.createdAt ? format(new Date(review.createdAt.toDate()), 'MMM dd, HH:mm') : 'N/A'}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Badge 
                          variant={review.isApproved !== false ? 'default' : 'secondary'}
                          className={review.isApproved !== false ? "text-[10px] font-medium bg-green-500/10 text-green-600 border-none" : "text-[10px] font-medium"}
                        >
                          {review.isApproved !== false ? 'Live' : 'Hidden'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4 px-3 py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-[10px] font-medium text-muted-foreground p-2">Moderation</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => toggleApproval(review.id, review.isApproved !== false)} className="rounded-md text-xs cursor-pointer">
                              {review.isApproved !== false ? (
                                <><XCircle className="mr-2 h-4 w-4 text-destructive" /> Hide Review</>
                              ) : (
                                <><CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Approve Review</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="rounded-md text-xs cursor-pointer">
                              <Link href={`/products/${review.productId}`} target="_blank">
                                <ExternalLink className="mr-2 h-4 w-4" /> View Product
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="rounded-md text-xs cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
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
            </div>
          ) : (
            <div className="flex h-60 flex-col items-center justify-center text-center p-8">
              <MessageSquare className="h-10 w-10 text-muted-foreground mb-3 opacity-20" />
              <h3 className="text-sm font-semibold">No reviews found</h3>
              <p className="text-xs text-muted-foreground mt-1">As users leave feedback on products, it will appear here for your review.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
