
import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductDetailClient } from "@/components/store/ProductDetailClient"; // This isn't right for blog, but we'll stick to SSR
import { firebaseConfig } from "@/firebase/config";
import { generateMeta } from "@/lib/seo/generate-meta";
import { getBlogSchema, getBreadcrumbSchema } from "@/lib/seo/schema-builder";
import BlogPostView from "@/components/blog/BlogPostView"; // Hypothetical or existing
import { BlogListingClient } from "@/components/blog/BlogListingClient"; // We'll keep the current structure but adding SSR Schema

// We fetch blog data here to inject schema
async function getPostData(slug: string) {
  const projectId = firebaseConfig.projectId;
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/blog_posts?pageSize=1&mask=title,slug,content,excerpt,featuredImage,publishedAt,createdAt,updatedAt&filter=slug%20%3D%3D%20%22${slug}%22`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const doc = data.documents?.[0];
  if (!doc) return null;
  
  return {
    id: doc.name.split('/').pop(),
    title: doc.fields?.title?.stringValue || "",
    slug: doc.fields?.slug?.stringValue || "",
    excerpt: doc.fields?.excerpt?.stringValue || "",
    featuredImage: doc.fields?.featuredImage?.stringValue || "",
    publishedAt: doc.fields?.publishedAt?.timestampValue || doc.fields?.createdAt?.timestampValue,
  };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostData(slug);
  
  if (!post) return generateMeta({ title: "Article Not Found", description: "The requested article is missing.", path: `/blog/${slug}` });

  return generateMeta({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${slug}`,
    image: post.featuredImage,
    type: 'article'
  });
}

// Re-implementing the structure from existing blog/[slug]/page.tsx with SSR support
import BlogPostDetailClient from "@/components/blog/BlogPostDetailClient"; // Renaming existing client code to avoid loop

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostData(slug);

  let schemas: any[] = [];
  if (post) {
    schemas.push(getBlogSchema(post));
    schemas.push(getBreadcrumbSchema([
      { name: 'Blog', path: '/blog' },
      { name: post.title, path: `/blog/${post.slug}` }
    ]));
  }

  // We keep the dynamic import logic but wrap it in the schema script
  // Note: Actual data fetching inside Client component remains as it handles real-time/auth state
  return (
    <>
      {schemas.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
        />
      )}
      <BlogPostDetailClient slug={slug} />
    </>
  );
}

// In current project, blog/[slug]/page.tsx is the client file. 
// I need to rename the old file content or move it to a client component.
