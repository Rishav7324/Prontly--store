'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  Eye
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
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { adminJsonFetcher, adminFetch } from '@/lib/auth/admin-fetch';

export default function AdminBlog() {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['admin-blog'],
    queryFn: () => adminJsonFetcher('/api/blog'),
    refetchInterval: 30000,
  });

  const filteredPosts = (posts as any[]).filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditor = (post: any) => {
    try {
      sessionStorage.setItem(`blog-edit-${post.slug}`, JSON.stringify(post));
    } catch {}
    window.location.href = `/admin/blog/edit/${post.slug}`;
  };

  const deletePost = async (post: any) => {
    if (!confirm('Delete this blog post?')) return;
    try {
      // API accepts firestore id or uuid
      const res = await adminFetch(`/api/blog?id=${encodeURIComponent(post.firestoreId || post.id)}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Delete failed');
      toast({ title: 'Article deleted', description: post.title });
      queryClient.invalidateQueries({ queryKey: ['admin-blog'] });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Delete failed', description: error?.message });
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-semibold">Blog Posts</h1>
          <p className="text-xs text-muted-foreground">Manage articles and news updates.</p>
        </div>
        <Button asChild size="sm" className="h-9 rounded-lg">
          <Link href="/admin/blog/new">
            <Plus className="mr-2 h-4 w-4" />
            New Article
          </Link>
        </Button>
      </header>

      <Card className="rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-lg"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse bg-muted rounded-lg" />
              ))}
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="px-3 py-2">Title</TableHead>
                    <TableHead className="px-3 py-2">Status</TableHead>
                    <TableHead className="px-3 py-2">Date</TableHead>
                    <TableHead className="px-3 py-2">Views</TableHead>
                    <TableHead className="px-3 py-2 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post: any) => (
                    <TableRow key={post.id}>
                      <TableCell className="px-3 py-2">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium line-clamp-1 max-w-[280px]">{post.title}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">/{post.slug}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="text-[10px] font-medium">
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {(post.publishedAt || post.createdAt) ? format(new Date(post.publishedAt || post.createdAt), 'MMM dd, yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          {post.viewCount || 0}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel className="text-[10px] font-medium text-muted-foreground p-2">Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild className="rounded-md text-xs cursor-pointer">
                              <button type="button" onClick={() => openEditor(post)} className="flex w-full items-center">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Post
                              </button>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="rounded-md text-xs cursor-pointer">
                              <Link href={`/blog/${post.slug}`} target="_blank">
                                <Eye className="mr-2 h-4 w-4" />
                                View Live
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="rounded-md text-xs cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                              onClick={() => deletePost(post)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
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
              <FileText className="h-10 w-10 text-muted-foreground mb-3 opacity-20" />
              <h3 className="text-sm font-semibold">No articles found</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Start writing your first blog post to attract more traffic.</p>
              <Button asChild size="sm" className="h-9 rounded-lg">
                <Link href="/admin/blog/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Article
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
