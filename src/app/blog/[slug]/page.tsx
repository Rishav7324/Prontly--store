'use client';

import { use, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowLeft, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';

export default function BlogPostDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const db = useFirestore();

  const postQuery = useMemoFirebase(() => {
    return db ? query(
      collection(db, 'blog_posts'),
      where('slug', '==', slug),
      limit(1)
    ) : null;
  }, [db, slug]);

  const { data: posts, loading } = useCollection(postQuery);
  const post = posts?.[0] as any;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 max-w-3xl space-y-8">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-12 w-full bg-muted animate-pulse rounded" />
          <div className="h-[400px] w-full bg-muted animate-pulse rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <h1 className="text-4xl font-bold mb-4">Post not found</h1>
          <Button asChild><Link href="/blog">Back to Blog</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-20 max-w-4xl">
        <article className="space-y-8">
          <header className="space-y-6">
            <Button variant="ghost" asChild className="pl-0 text-muted-foreground hover:text-primary">
              <Link href="/blog"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog</Link>
            </Button>
            
            <div className="flex flex-wrap gap-2">
              {post.tags?.map((tag: string) => (
                <Badge key={tag} className="bg-primary/10 text-primary border-none uppercase font-bold text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>

            <h1 className="text-4xl md:text-6xl font-bold font-headline leading-tight">
              {post.title}
            </h1>

            <div className="flex items-center justify-between py-6 border-y border-white/5">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold">{post.authorName || 'Prontly Team'}</p>
                  <p className="text-xs text-muted-foreground">
                    {post.publishedAt ? format(new Date(post.publishedAt.toDate()), 'MMMM dd, yyyy') : 'Recent Post'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full"><Twitter className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="rounded-full"><Linkedin className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="rounded-full"><Share2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </header>

          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-3xl border border-white/5 bg-muted">
            <Image 
              src={post.featuredImage || `https://picsum.photos/seed/${post.id}/1200/600`} 
              alt={post.title} 
              fill 
              className="object-cover" 
              priority
              data-ai-hint="featured article image"
            />
          </div>

          <div 
            className="prose prose-invert prose-lg max-w-none prose-headings:font-headline prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <footer className="pt-12 mt-12 border-t border-white/5">
            <div className="bg-muted/30 p-8 rounded-3xl flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
              <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <User className="h-10 w-10 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-bold font-headline mb-2">About the Author</h4>
                <p className="text-muted-foreground text-sm">
                  The Prontly editorial team provides expert insights into the world of AI, design, and digital creation.
                </p>
              </div>
            </div>
          </footer>
        </article>
      </main>

      <Footer />
    </div>
  );
}
