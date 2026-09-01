'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Search,
  Star,
  MessageSquare,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import Link from 'next/link';
import { adminJsonFetcher } from '@/lib/auth/admin-fetch';

export default function AdminReviewsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => adminJsonFetcher('/api/products'),
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ['reviews', selectedProductId],
    queryFn: () => adminJsonFetcher(`/api/reviews?productId=${encodeURIComponent(selectedProductId)}`),
    enabled: !!selectedProductId,
  });

  const filteredReviews = useMemo(() =>
    (reviews as any[]).filter(r =>
      r.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.comment?.toLowerCase().includes(searchTerm.toLowerCase())
    ), [reviews, searchTerm]);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-lg md:text-xl font-semibold">Reviews</h1>
        <p className="text-xs text-muted-foreground">Monitor customer feedback per product (read-only).</p>
      </header>

      <Card className="rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col md:flex-row gap-3 justify-between">
            <div className="relative w-full max-w-xs">
              <select
                className="w-full bg-background border rounded-lg px-3 h-10 text-xs outline-none focus:ring-1 focus:ring-primary"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">{productsLoading ? 'Loading products…' : 'Select a product…'}</option>
                {(products as any[]).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by customer or comment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={!selectedProductId}
                className="pl-9 h-10 rounded-lg"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!selectedProductId ? (
            <div className="flex h-60 flex-col items-center justify-center text-center p-8">
              <MessageSquare className="h-10 w-10 text-muted-foreground mb-3 opacity-20" />
              <h3 className="text-sm font-semibold">Select a product</h3>
              <p className="text-xs text-muted-foreground mt-1">Choose a product above to inspect its verified reviews.</p>
            </div>
          ) : reviewsLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse bg-muted rounded-lg" />
              ))}
            </div>
          ) : filteredReviews.length > 0 ? (
            <div className="-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="px-3 py-2">Customer</TableHead>
                    <TableHead className="px-3 py-2">Rating</TableHead>
                    <TableHead className="px-3 py-2">Comment</TableHead>
                    <TableHead className="px-3 py-2">Date</TableHead>
                    <TableHead className="px-3 py-2 text-right">Product</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review: any) => (
                    <TableRow key={review.id}>
                      <TableCell className="px-3 py-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border">
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
                        <p className="text-xs italic text-muted-foreground line-clamp-2">&quot;{review.comment}&quot;</p>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-[10px] text-muted-foreground whitespace-nowrap">
                        {review.createdAt ? format(new Date(review.createdAt), 'MMM dd, HH:mm') : 'N/A'}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-right">
                        <Button variant="ghost" size="sm" asChild className="h-9 rounded-lg text-[10px] font-medium text-primary gap-1">
                          <Link href="/admin/products" target="_blank">
                            <ExternalLink className="h-3 w-3" /> View Product
                          </Link>
                        </Button>
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
              <p className="text-xs text-muted-foreground mt-1">As users leave feedback on this product, it will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
