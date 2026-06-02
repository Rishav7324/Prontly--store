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

export default function BlogPostDetailClient({ slug }: { slug: string }) {
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
      
      <main className="flex-1 container mx-auto px-4 pt-20 pb-12 max-w-4xl">
        <article className="space-y-8">
          <header className="space-y-6 text-center">
            <div className="flex justify-center">
              <Button variant="ghost" asChild className="text-muted-foreground hover:text-primary rounded-full px-6 h-10">
                <Link href="/blog"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog</Link>
              </Button>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2">
              {post.tags?.map((tag: string) => (
                <Badge key={tag} className="bg-primary/10 text-primary border-none uppercase font-bold text-[10px] px-3 py-1">
                  {tag}
                </Badge>
              ))}
            </div>

            <h1 className="text-4xl md:text-7xl font-bold font-headline leading-tight max-w-4xl mx-auto tracking-tight">
              {post.title}
            </h1>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 py-6 border-y border-white/5">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">{post.authorName || 'Prontly Team'}</p>
                  <p className="text-xs text-muted-foreground">
                    {post.publishedAt ? format(new Date(post.publishedAt.toDate()), 'MMMM dd, yyyy') : 'Recent Post'}
                  </p>
                </div>
              </div>
              <div className="h-4 w-[1px] bg-white/10 hidden md:block" />
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="rounded-full h-9 w-9 border-white/5 bg-white/5 hover:bg-primary hover:text-white transition-all"><Twitter className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" size="icon" className="rounded-full h-9 w-9 border-white/5 bg-white/5 hover:bg-primary hover:text-white transition-all"><Linkedin className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" size="icon" className="rounded-full h-9 w-9 border-white/5 bg-white/5 hover:bg-primary hover:text-white transition-all"><Share2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </header>

          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-[2rem] border border-white/5 bg-muted shadow-2xl">
            <Image 
              src={post.featuredImage || `https://picsum.photos/seed/${post.id}/1200/600`} 
              alt={post.title} 
              fill 
              className="object-cover transition-transform duration-1000 group-hover:scale-105" 
              priority
            />
          </div>

          <div 
            className="prose-content mx-auto text-base leading-relaxed text-slate-blue max-w-3xl"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <footer className="pt-10 mt-16 border-t border-white/5">
            <div className="bg-card/50 border border-white/5 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 text-center md:text-left transition-all hover:border-primary/20">
              <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-xl shadow-primary/20">
                <User className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-3">
                <h4 className="text-xl font-bold font-headline text-foreground">About the Editorial Team</h4>
                <p className="text-muted-foreground text-base leading-relaxed">
                  The Prontly editorial team provides expert insights into the world of AI, design, and digital creation. We focus on delivering production-ready knowledge for modern creators.
                </p>
                <div className="flex justify-center md:justify-start gap-4">
                  <Link href="/blog" className="text-primary font-bold text-xs uppercase tracking-widest hover:text-accent transition-all">More Articles →</Link>
                </div>
              </div>
            </div>
          </footer>
        </article>
      </main>

      <Footer />
    </div>
  );
}
