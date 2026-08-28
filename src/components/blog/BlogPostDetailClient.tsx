'use client';

import { useMemo, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  User,
  ArrowLeft,
  Twitter,
  Clock,
  ChevronRight,
  Link2,
  Check,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export default function BlogPostDetailClient({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  // Post — Neon via API
  const { data: post, isLoading: loading } = useQuery({
    queryKey: ['blog', 'post', slug],
    queryFn: async () => {
      const res = await fetch(`/api/blog?slug=${encodeURIComponent(slug)}`);
      const json = await res.json();
      return json?.success ? json.data : null;
    },
    enabled: !!slug,
  });

  // Related posts — latest 3 others
  const { data: allPosts } = useQuery({
    queryKey: ['blog', 'list'],
    queryFn: async () => {
      const res = await fetch('/api/blog');
      const json = await res.json();
      return json?.success ? (json.data as any[]) : [];
    },
  });

  const relatedPosts = (allPosts || [])
    .filter((p: any) => p.slug !== slug)
    .slice(0, 3);

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
        <div className="container mx-auto px-4 pt-20 md:pt-24 max-w-4xl space-y-4">
          <div className="h-3 w-24 bg-muted animate-pulse rounded" />
          <div className="h-7 w-full max-w-xl bg-muted animate-pulse rounded-lg" />
          <div className="aspect-video w-full bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Sparkles className="h-5 w-5 text-muted-foreground opacity-40" />
          </div>
          <h1 className="text-lg md:text-xl font-semibold mb-3">Article Not Found</h1>
          <Button asChild variant="outline" className="h-8 rounded-lg text-xs">
            <Link href="/blog">Return to Blog</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 pt-20 md:pt-24 pb-14 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">

          {/* STICKY SIDE SHARE - DESKTOP */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-28 flex flex-col items-center gap-1.5">
              <span className="text-[10px] font-medium text-muted-foreground mb-2 vertical-text">Share</span>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-lg h-8 w-8 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                onClick={() => handleSocialShare('twitter')}
              >
                <Twitter className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-lg h-8 w-8 hover:bg-green-50 hover:text-green-500 transition-colors"
                onClick={() => handleSocialShare('whatsapp')}
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-lg h-8 w-8 hover:bg-primary/5 hover:text-primary transition-colors"
                onClick={handleCopyLink}
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Link2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </aside>

          {/* MAIN ARTICLE BODY */}
          <article className={cn("space-y-6", "lg:col-span-11")}>
            <header className="space-y-4 max-w-3xl">
              <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
                <ChevronRight className="h-3 w-3 opacity-50" />
                <span>Article</span>
              </nav>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {post.tags?.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="bg-primary/5 text-primary border-none text-[10px] font-medium px-2 py-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <h1 className="text-2xl md:text-4xl font-semibold leading-snug tracking-tight break-words max-w-full">
                  {post.title}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3" />
                  <span className="font-medium text-foreground">{post.authorName || 'Prontly Store'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {post.publishedAt || post.createdAt ? format(new Date(post.publishedAt || post.createdAt), 'MMM dd, yyyy') : 'Recently'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  <span>{readingTime}</span>
                </div>
              </div>
            </header>

            <div className="relative h-[220px] md:h-[360px] w-full overflow-hidden rounded-xl border bg-muted shadow-sm group">
              <Image
                src={post.featuredImage || `https://picsum.photos/seed/${post.id}/1200/600`}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                priority
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
               <div className="lg:col-span-8">
                  <div
                    className="prose-content text-sm leading-[1.75] text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />

                  <footer className="pt-8 mt-10 border-t">
                    <div className="rounded-xl shadow-sm border p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-card hover:border-primary/20 transition-colors">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                           <h4 className="text-sm font-semibold">Prontly Editorial</h4>
                           <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] font-medium px-1.5 py-0">Verified</Badge>
                        </div>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          Professional insights engineered for the digital creative class. Our mission is to synchronize high-performance AI prompts and UI systems with modern workflows.
                        </p>
                        <Link href="/blog" className="inline-flex items-center gap-1.5 text-primary text-xs font-medium hover:underline">
                          Explore Archive <ArrowLeft className="h-3 w-3 rotate-180" />
                        </Link>
                      </div>
                    </div>
                  </footer>
               </div>

               {/* SIDEBAR */}
               <aside className="lg:col-span-4 space-y-4">
                  <div className="rounded-xl shadow-sm border bg-midnight-ink text-white p-4 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-3 opacity-10 rotate-12 pointer-events-none">
                        <Sparkles className="h-20 w-20" />
                     </div>
                     <div className="relative z-10 space-y-3">
                        <Badge variant="outline" className="bg-transparent text-white border-white/20 text-[10px] font-medium px-2 py-0">Marketplace</Badge>
                        <h4 className="text-base md:text-lg font-semibold leading-snug">Elevate Your Workflow.</h4>
                        <p className="text-xs text-white/60 leading-relaxed">Acquire the verified digital assets mentioned in this guide and start creating today.</p>
                        <Button asChild className="w-full bg-white text-midnight-ink hover:bg-white/90 h-9 rounded-lg text-xs font-medium">
                           <Link href="/products">Explore Catalog</Link>
                        </Button>
                     </div>
                  </div>

                  <div className="rounded-xl shadow-sm border p-4 bg-card space-y-3">
                     <h5 className="text-[10px] font-medium text-muted-foreground">Newsletter</h5>
                     <p className="text-xs font-medium leading-snug">Join our newsletter to receive weekly technical audits and asset drops.</p>
                     <div className="flex gap-1.5">
                        <input className="flex-1 bg-muted/50 rounded-lg px-3 text-xs border-none focus:ring-1 focus:ring-primary h-9 outline-none placeholder:text-muted-foreground" placeholder="name@domain.com" />
                        <Button size="icon" className="rounded-lg h-9 w-9 shrink-0"><ArrowLeft className="h-3.5 w-3.5 rotate-180" /></Button>
                     </div>
                  </div>
               </aside>
            </div>

            {/* RELATED ARTICLES */}
            {relatedPosts.length > 0 && (
              <section className="mt-14 pt-8 border-t">
                <h2 className="text-base md:text-lg font-semibold mb-5">Related Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {relatedPosts.map((rp: any) => (
                    <Link
                      key={rp.id}
                      href={`/blog/${rp.slug}`}
                      className="group rounded-xl overflow-hidden border bg-card shadow-sm hover:border-primary/25 transition-colors"
                    >
                      <div className="relative aspect-video w-full overflow-hidden">
                        <Image
                          src={rp.featuredImage || `https://picsum.photos/seed/${rp.id}/600/340`}
                          alt={rp.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-3 space-y-1.5">
                        <h3 className="text-sm font-semibold leading-snug line-clamp-2">{rp.title}</h3>
                        <p className="text-[11px] text-muted-foreground">
                          {rp.publishedAt || rp.createdAt ? format(new Date(rp.publishedAt || rp.createdAt), 'MMM dd, yyyy') : 'Recently'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
