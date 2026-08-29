import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { firebaseConfig } from '@/firebase/config';
import { generateMeta } from '@/lib/seo/generate-meta';
import { Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';

import { getDb } from '@/lib/db';
import { blogPosts } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

async function getPosts() {
  // 1. Primary: Query Neon PostgreSQL
  try {
    if (process.env.DATABASE_URL) {
      const db = getDb();
      const rows = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.status, 'published'))
        .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt));

      if (rows && rows.length > 0) {
        return rows.map((r: any) => ({
          id: r.id || r.firestoreId,
          title: r.title,
          slug: r.slug,
          excerpt: r.excerpt,
          featuredImage: r.featuredImage,
          status: r.status,
          publishedAt: r.publishedAt || r.createdAt,
          tags: Array.isArray(r.tags) ? r.tags : [],
        }));
      }
    }
  } catch (dbErr) {
    console.warn('[BLOG_DB_FETCH_ERR]:', dbErr);
  }

  // 2. Fallback: Query Firestore REST API
  try {
    const projectId = firebaseConfig.projectId;
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/blog_posts?pageSize=100`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.documents || [])
      .map((doc: any) => {
        const fields = doc.fields || {};
        return {
          id: doc.name.split('/').pop(),
          title: fields.title?.stringValue || "",
          slug: fields.slug?.stringValue || "",
          excerpt: fields.excerpt?.stringValue || "",
          featuredImage: fields.featuredImage?.stringValue || "",
          status: fields.status?.stringValue || "draft",
          publishedAt: fields.publishedAt?.timestampValue || fields.createdAt?.timestampValue,
          tags: fields.tags?.arrayValue?.values?.map((v: any) => v.stringValue) || []
        };
      })
      .filter((p: any) => p.status === 'published');
  } catch (error) {
    console.error('[BLOG_FETCH_ERR]:', error);
    return [];
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "AI Prompt Tips & Creator Guides — Prontly Blog",
    description: "Expert guides on AI prompt engineering, creator workflows, and digital product best practices — from the Prontly team.",
    path: '/blog'
  });
}

export default async function BlogListingPage() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 pt-20 md:pt-24 pb-12">
        <header className="max-w-xl mb-8">
          <Badge variant="outline" className="mb-2 text-[10px] font-medium border-primary/50 text-primary px-2 py-0">Insights & Updates</Badge>
          <h1 className="text-2xl md:text-4xl font-semibold font-headline mb-1.5">The Prontly Blog</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Expert guides, industry news, and tips to master your digital workflow.</p>
        </header>

        {posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0 max-w-full">
            {posts.map((post: any) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                <Card className="h-full overflow-hidden border bg-card transition-all hover:border-primary/30 hover:shadow-md rounded-xl shadow-sm">
                  <div className="relative aspect-video overflow-hidden bg-muted border-b">
                    <Image
                      src={post.featuredImage || `https://picsum.photos/seed/${post.id}/800/450`}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <CardHeader className="space-y-1.5 p-4 pb-0">
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {post.publishedAt ? format(new Date(post.publishedAt), 'MMM dd, yyyy') : 'Recently'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        5 min read
                      </div>
                    </div>
                    <CardTitle className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-4">
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags?.slice(0, 3).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] font-medium px-1.5 py-0">
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
          <div className="text-center py-14 bg-muted/20 rounded-xl border border-dashed shadow-sm p-6">
            <h3 className="text-sm font-semibold mb-1">New Insights Coming Soon</h3>
            <p className="text-xs text-muted-foreground">We are curating expert guides for you. Check back shortly.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
