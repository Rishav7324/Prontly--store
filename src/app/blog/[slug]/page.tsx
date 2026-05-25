import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { firebaseConfig } from "@/firebase/config";
import { generateMeta } from "@/lib/seo/generate-meta";
import { getBlogSchema, getBreadcrumbSchema } from "@/lib/seo/schema-builder";
import BlogPostDetailClient from "@/components/blog/BlogPostDetailClient";

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
