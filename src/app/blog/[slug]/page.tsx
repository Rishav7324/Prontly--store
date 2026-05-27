import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogPostDetailClient from '@/components/blog/BlogPostDetailClient';
import { firebaseConfig } from '@/firebase/config';
import { generateMeta } from '@/lib/seo/generate-meta';

/**
 * PRODUCTION BLOG RESOLVER
 */
async function getPostBySlug(slug: string) {
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
      next: { revalidate: 3600 }
    });

    if (res.ok) {
      const data = await res.json();
      if (data[0]?.document) {
        return {
          id: data[0].document.name.split('/').pop(),
          slug: slug
        };
      }
    }
  } catch (error) {
    console.error(error);
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return generateMeta({
    title: "Article Details",
    description: "Insights and updates from the Prontly team.",
    path: `/blog/${slug}`,
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
