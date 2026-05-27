import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { firebaseConfig } from "@/firebase/config";
import { generateMeta } from "@/lib/seo/generate-meta";
import { getBlogSchema, getBreadcrumbSchema } from "@/lib/seo/schema-builder";
import BlogPostDetailClient from "@/components/blog/BlogPostDetailClient";

interface BlogPageProps {
  params: Promise<{ id: string }>;
}

async function getPostData(identifier: string) {
  const projectId = firebaseConfig.projectId;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  // 1. Attempt slug query
  const res = await fetch(
    `${baseUrl}:runQuery`,
    { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'blog_posts' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'slug' },
              op: 'EQUAL',
              value: { stringValue: identifier }
            }
          },
          limit: 1
        }
      }),
      next: { revalidate: 3600 } 
    }
  );
  
  if (res.ok) {
    const results = await res.json();
    const doc = results[0]?.document;
    if (doc) {
      const fields = doc.fields || {};
      return {
        id: doc.name.split('/').pop(),
        title: fields.title?.stringValue || "",
        slug: fields.slug?.stringValue || "",
        excerpt: fields.excerpt?.stringValue || "",
        featuredImage: fields.featuredImage?.stringValue || "",
        publishedAt: fields.publishedAt?.timestampValue || fields.createdAt?.timestampValue,
      };
    }
  }

  // 2. Fallback to direct ID lookup
  const idRes = await fetch(`${baseUrl}/blog_posts/${identifier}`, { next: { revalidate: 3600 } });
  if (idRes.ok) {
    const doc = await idRes.json();
    const fields = doc.fields || {};
    const actualSlug = fields.slug?.stringValue;
    if (actualSlug && actualSlug !== identifier) {
      return { needsRedirect: true, targetSlug: actualSlug };
    }
    return {
      id: doc.name.split('/').pop(),
      title: fields.title?.stringValue || "",
      slug: fields.slug?.stringValue || "",
      excerpt: fields.excerpt?.stringValue || "",
      featuredImage: fields.featuredImage?.stringValue || "",
      publishedAt: fields.publishedAt?.timestampValue || fields.createdAt?.timestampValue,
    };
  }

  return null;
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { id } = await params;
  const post: any = await getPostData(id);
  if (!post || post.needsRedirect) return generateMeta({ title: "Article", description: "Blog update", path: `/blog/${id}` });
  return generateMeta({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug || post.id}`,
    image: post.featuredImage,
    type: 'article'
  });
}

export default async function BlogPostPage({ params }: BlogPageProps) {
  const { id } = await params;
  const post: any = await getPostData(id);
  
  if (!post) notFound();
  if (post.needsRedirect) redirect(`/blog/${post.targetSlug}`);

  let schemas: any[] = [];
  schemas.push(getBlogSchema(post));
  schemas.push(getBreadcrumbSchema([
    { name: 'Blog', path: '/blog' },
    { name: post.title, path: `/blog/${post.slug || post.id}` }
  ]));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <BlogPostDetailClient slug={post.slug || id} />
    </>
  );
}
