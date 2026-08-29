import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogPostDetailClient from '@/components/blog/BlogPostDetailClient';
import { firebaseConfig } from '@/firebase/config';
import { generateMeta } from '@/lib/seo/generate-meta';
import { getDb } from '@/lib/db';
import { blogPosts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * PRODUCTION BLOG RESOLVER
 * Fetches full document data for metadata generation.
 */
async function getPostBySlug(slug: string) {
  // 1. Primary: Neon PostgreSQL
  try {
    if (process.env.DATABASE_URL) {
      const db = getDb();
      const [post] = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.slug, slug))
        .limit(1);

      if (post && post.status === 'published') {
        return {
          id: post.id || post.firestoreId,
          title: post.title,
          excerpt: post.excerpt || '',
          featuredImage: post.featuredImage || '',
          slug: post.slug,
        };
      }
    }
  } catch (dbErr) {
    console.warn('[BLOG_SLUG_DB_ERR]:', dbErr);
  }

  // 2. Fallback: Firestore REST API
  const projectId = firebaseConfig.projectId;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  const query = {
    structuredQuery: {
      from: [{ collectionId: 'blog_posts' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'slug' },
          op: 'EQUAL',
          value: { stringValue: slug }
        }
      },
      limit: 1
    }
  };

  try {
    const res = await fetch(`${baseUrl}:runQuery`, {
      method: 'POST',
      body: JSON.stringify(query),
      next: { revalidate: 60 }
    });

    if (res.ok) {
      const data = await res.json();
      if (data[0]?.document) {
        const doc = data[0].document;
        const fields = doc.fields;
        return {
          id: doc.name.split('/').pop(),
          title: fields.title?.stringValue || '',
          excerpt: fields.excerpt?.stringValue || '',
          featuredImage: fields.featuredImage?.stringValue || '',
          slug: slug
        };
      }
    }
  } catch (error) {
    console.error('[BLOG_RESOLVER_FAULT]:', error);
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return generateMeta({
      title: "Article Not Found",
      description: "This blog post does not exist or has been removed.",
      path: `/blog/${slug}`
    });
  }

  return generateMeta({
    title: post.title,
    description: post.excerpt || "Insights and updates from the Prontly team.",
    path: `/blog/${slug}`,
    image: post.featuredImage,
    type: 'article'
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return <BlogPostDetailClient slug={slug} />;
}
