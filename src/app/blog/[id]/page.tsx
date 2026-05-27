
import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { firebaseConfig } from "@/firebase/config";
import { generateMeta } from "@/lib/seo/generate-meta";
import { getBlogSchema, getBreadcrumbSchema } from "@/lib/seo/schema-builder";
import BlogPostDetailClient from "@/components/blog/BlogPostDetailClient";

async function getPostData(identifier: string) {
  const projectId = firebaseConfig.projectId;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  // Try fetching by slug first
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
  
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostData(id);
  
  if (!post) return generateMeta({ title: "Article Not Found", description: "The requested article is missing.", path: `/blog/${id}` });

  return generateMeta({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug || post.id}`,
    image: post.featuredImage,
    type: 'article'
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPostData(id);

  let schemas: any[] = [];
  if (post) {
    schemas.push(getBlogSchema(post));
    schemas.push(getBreadcrumbSchema([
      { name: 'Blog', path: '/blog' },
      { name: post.title, path: `/blog/${post.slug || post.id}` }
    ]));
  }

  return (
    <>
      {schemas.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
        />
      )}
      <BlogPostDetailClient slug={id} />
    </>
  );
}
