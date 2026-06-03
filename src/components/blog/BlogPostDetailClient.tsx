'use client';

import { use, useMemo, useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  User, 
  ArrowLeft, 
  Share2, 
  Twitter, 
  Linkedin, 
  Clock, 
  ChevronRight,
  Link2,
  Check,
  Facebook,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export default function BlogPostDetailClient({ slug }: { slug: string }) {
  const db = useFirestore();
  const [copied, setCopied] = useState(false);

  const postQuery = useMemoFirebase(() => {
    return db ? query(
      collection(db, 'blog_posts'),
      where('slug', '==', slug),
      limit(1)
    ) : null;
  }, [db, slug]);

  const { data: posts, loading } = useCollection(postQuery);
  const post = posts?.[0] as any;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast({ title: "Link Copied", description: "The editorial path is now in your clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSocialShare = (platform: string) => {
    if (!post) return;
    const shareUrl = window.location.href;
    const text = `Insight: ${post.title} via Prontly Store`;
    let url = '';

    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + shareUrl)}`;
        break;
    }

    if (url) window.open(url, '_blank');
  };

  const readingTime = useMemo(() => {
    if (!post?.content) return '5 min';
    const words = post.content.replace(/<[^>]*>?/gm, '').split(/\s+/).length;
    return `${Math.ceil(words / 225)} min read`;
  }, [post?.content]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-32 max-w-3xl space-y-8">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-16 w-full bg-muted animate-pulse rounded-2xl" />
          <div className="h-[400px] w-full bg-muted animate-pulse rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
             <Sparkles className="h-8 w-8 text-muted-foreground opacity-20" />
          </div>
          <h1 className="text-3xl font-bold font-headline mb-4">Article Not Found</h1>
          <Button asChild className="rounded-xl h-12 px-8"><Link href="/blog">Return to Editorial</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 pt-32 pb-16 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative">
          
          {/* STICKY SIDE SHARE - DESKTOP */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-32 flex flex-col items-center gap-4">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-ghost-gray vertical-text mb-4 opacity-40">Distribute</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-10 w-10 hover:bg-blue-50 hover:text-blue-500 transition-all border border-transparent hover:border-blue-100"
                onClick={() => handleSocialShare('twitter')}
              >
                <Twitter className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-10 w-10 hover:bg-green-50 hover:text-green-500 transition-all border border-transparent hover:border-green-100"
                onClick={() => handleSocialShare('whatsapp')}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full h-10 w-10 hover:bg-primary/5 hover:text-primary transition-all border border-transparent hover:border-primary/10" 
                onClick={handleCopyLink}
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4" />}
              </Button>
            </div>
          </aside>

          {/* MAIN ARTICLE BODY */}
          <article className="lg:col-span-10 space-y-10">
            <header className="space-y-8 max-w-3xl">
              <nav className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] text-primary mb-4">
                <Link href="/blog" className="hover:opacity-70 transition-opacity">Blog</Link>
                <ChevronRight className="h-2.5 w-2.5 opacity-40" />
                <span className="text-midnight-ink opacity-60">Insight Case</span>
              </nav>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {post.tags?.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="bg-primary/5 text-primary border-none uppercase font-bold text-[9px] tracking-widest px-3 py-0.5 rounded-full">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <h1 className="text-2xl md:text-6xl lg:text-7xl font-bold font-headline leading-[1.1] tracking-tight text-midnight-ink">
                  {post.title}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-stone-gray/5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/5">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-ghost-gray">Author</p>
                    <p className="text-xs font-bold text-midnight-ink">{post.authorName || 'Prontly Store'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center text-ghost-gray">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-ghost-gray">Released</p>
                    <p className="text-xs font-bold text-midnight-ink">
                      {post.publishedAt || post.createdAt ? format(new Date((post.publishedAt || post.createdAt).toDate()), 'MMM dd, yyyy') : 'Recently'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center text-ghost-gray">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-ghost-gray">Tempo</p>
                    <p className="text-xs font-bold text-midnight-ink">{readingTime}</p>
                  </div>
                </div>
              </div>
            </header>

            <div className="relative h-[160px] w-full overflow-hidden rounded-[1rem] border border-stone-gray/10 bg-muted shadow-2xl group">
              <Image
                src={post.featuredImage || `https://picsum.photos/seed/${post.id}/1200/600`}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                priority 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
               <div className="lg:col-span-8 lg:col-start-1">
                  <div
                    className="prose-content text-base leading-[1.8] text-slate-blue"
                    dangerouslySetInnerHTML={{ __html: post.content }} 
                  />

                  <footer className="pt-12 mt-16 border-t border-stone-gray/5">
                    <div className="bg-muted/20 border border-stone-gray/10 p-8 rounded-[2rem] flex flex-col md:flex-row items-center gap-8 group hover:bg-white hover:border-primary/20 transition-all duration-500 shadow-sm">
                      <div className="h-20 w-20 rounded-[1.5rem] bg-midnight-ink flex items-center justify-center shrink-0 shadow-2xl shadow-black/20 transition-transform group-hover:scale-105">
                        <User className="h-10 w-10 text-white" />
                      </div>
                      <div className="space-y-3 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2">
                           <h4 className="text-xl font-bold font-headline text-midnight-ink">Prontly Editorial Node</h4>
                           <Badge className="bg-primary/10 text-primary border-none text-[8px] uppercase font-black px-2">Verified Team</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
                          Professional insights engineered for the digital creative class. Our mission is to synchronize high-performance AI prompts and UI systems with modern workflows.
                        </p>
                        <div className="flex justify-center md:justify-start gap-4">
                          <Link href="/blog" className="text-primary font-black text-[10px] uppercase tracking-[0.2em] hover:text-accent transition-all flex items-center gap-2 group/link">
                            Explore Archive <ArrowLeft className="h-3 w-3 rotate-180 transition-transform group-hover/link:translate-x-1" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </footer>
               </div>
               
               {/* SIDEBAR CTA - MOBILE & DESKTOP DESK */}
               <aside className="lg:col-span-4 space-y-8">
                  <div className="p-8 rounded-[2rem] bg-midnight-ink text-white space-y-6 relative overflow-hidden shadow-2xl">
                     <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 transition-transform duration-1000">
                        <Sparkles className="h-32 w-32" />
                     </div>
                     <div className="relative z-10 space-y-4">
                        <Badge className="bg-white/10 text-white border-white/20 uppercase tracking-[0.2em] font-black text-[9px]">Marketplace</Badge>
                        <h4 className="text-2xl font-bold font-headline leading-tight">Elevate Your Workflow.</h4>
                        <p className="text-xs text-white/60 leading-relaxed font-medium">Acquire the verified digital assets mentioned in this guide and start creating today.</p>
                        <Button asChild className="w-full bg-white text-midnight-ink hover:bg-white/90 h-12 rounded-xl font-bold text-sm">
                           <Link href="/products">Explore Catalog</Link>
                        </Button>
                     </div>
                  </div>

                  <div className="p-8 rounded-[2rem] border border-stone-gray/10 bg-white space-y-4 shadow-sm">
                     <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-ghost-gray">Sync Intelligence</h5>
                     <p className="text-sm font-bold text-midnight-ink leading-tight">Join our newsletter to receive weekly technical audits and asset drops.</p>
                     <div className="flex gap-2">
                        <input className="flex-1 bg-muted/50 rounded-lg px-4 text-xs font-medium border-none focus:ring-1 focus:ring-primary h-10" placeholder="name@domain.com" />
                        <Button size="icon" className="rounded-lg h-10 w-10 shrink-0"><ArrowLeft className="h-4 w-4 rotate-180" /></Button>
                     </div>
                  </div>
               </aside>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
