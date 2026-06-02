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

async function getPosts() {
  const projectId = firebaseConfig.projectId;
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/blog_posts?pageSize=100`,
    { next: { revalidate: 3600 } }
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
    });
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
      
      <main className="flex-1 container mx-auto px-4 pt-28 pb-12">
        <header className="max-w-2xl mb-10">
          <Badge variant="outline" className="mb-3 border-primary/50 text-primary">Insights & Updates</Badge>
          <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">The Prontly Blog</h1>
          <p className="text-lg text-muted-foreground">Expert guides, industry news, and tips to master your digital workflow.</p>
        </header>

        {posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post: any) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                <Card className="h-full overflow-hidden border-white/5 bg-card/50 transition-all hover:border-primary/30 rounded-2xl">
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <Image 
                      src={post.featuredImage || `https://picsum.photos/seed/${post.id}/800/450`} 
                      alt={post.title} 
                      fill 
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <CardHeader className="space-y-1.5 p-5">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {post.publishedAt ? format(new Date(post.publishedAt), 'MMM dd, yyyy') : 'Recently'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        5 min read
                      </div>
                    </div>
                    <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">
                      {post.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 px-5 pb-5">
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
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
            <h3 className="text-2xl font-bold">New Insights Coming Soon</h3>
            <p className="text-muted-foreground">We are curating expert guides for you. Check back shortly.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
