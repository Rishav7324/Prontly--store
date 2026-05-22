'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Calendar, Clock, ArrowRight, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

export default function BlogListingPage() {
  const db = useFirestore();
  
  const blogQuery = useMemoFirebase(() => {
    return db ? query(
      collection(db, 'blog_posts'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc')
    ) : null;
  }, [db]);

  const { data: posts, loading } = useCollection(blogQuery);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-20">
        <header className="max-w-2xl mb-16">
          <Badge variant="outline" className="mb-4 border-primary/50 text-primary">Insights & Updates</Badge>
          <h1 className="text-4xl md:text-6xl font-bold font-headline mb-6">The Prontly Blog</h1>
          <p className="text-xl text-muted-foreground">Expert guides, industry news, and tips to master your digital workflow.</p>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[400px] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post: any) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                <Card className="h-full overflow-hidden border-white/5 bg-card/50 transition-all hover:border-primary/30">
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <Image 
                      src={post.featuredImage || `https://picsum.photos/seed/${post.id}/800/450`} 
                      alt={post.title} 
                      fill 
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      data-ai-hint="blog post image"
                    />
                  </div>
                  <CardHeader className="space-y-2">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {post.publishedAt ? format(new Date(post.publishedAt.toDate()), 'MMM dd, yyyy') : 'Recently'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        5 min read
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {post.tags?.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] uppercase font-bold px-2 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed">
            <h3 className="text-2xl font-bold">No articles yet</h3>
            <p className="text-muted-foreground">Stay tuned for updates from our team.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
