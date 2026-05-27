import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { firebaseConfig } from '@/firebase/config';
import { generateMeta } from '@/lib/seo/generate-meta';
import BlogPostDetailClient from '@/components/blog/BlogPostDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getPost(idOrSlug: string) {
  const projectId = firebaseConfig.projectId;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  
  // 1. Try Slug Match
  const slugQuery = {
    structuredQuery: {
      from: [{ collectionId: 'blog_posts' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'slug' },
          op: 'EQUAL',
          value: { stringValue: idOrSlug }
        }
      },
      limit: 1
    }
  };

  const slugRes = await fetch(`${baseUrl}:runQuery`, {
    method: 'POST',
    body: JSON.stringify(slugQuery),
    next: { revalidate: 3600 }
  });

  const slugData = await slugRes.json();
  if (slugData?.[0]?.document) {
    return { slug: idOrSlug };
  }

  // 2. Try ID Match
  const idRes = await fetch(`${baseUrl}/blog_posts/${idOrSlug}`, { next: { revalidate: 3600 } });
  if (idRes.ok) {
    const doc = await idRes.json();
    const slug = doc.fields?.slug?.stringValue;
    if (slug) return { redirect: `/blog/${slug}` };
    return { slug: idOrSlug };
  }

  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const postInfo = await getPost(id);
  
  if (!postInfo || postInfo.redirect) {
    return generateMeta({ title: "Article Not Found", description: "", path: "/blog" });
  }

  return generateMeta({
    title: "Article Detail",
    description: "Read the latest from the Prontly blog.",
    path: `/blog/${postInfo.slug}`,
    type: 'article'
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getPost(id);

  if (!result) notFound();
  if (result.redirect) redirect(result.redirect);

  return <BlogPostDetailClient slug={result.slug} />;
}
