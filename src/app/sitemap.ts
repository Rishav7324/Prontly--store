import { MetadataRoute } from 'next';
import { firebaseConfig } from '@/firebase/config';

/**
 * @fileOverview Automatic Sitemap Generator
 * Fetches all dynamic content from Firestore to ensure search engines are synced.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';
  const projectId = firebaseConfig.projectId;
  
  // Base static routes
  const staticRoutes = [
    '',
    '/products',
    '/blog',
    '/testimonials',
    '/wishlist',
    '/terms',
    '/privacy',
    '/refund-policy',
    '/delivery-policy',
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  try {
    // 1. Fetch Products
    const productsRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products?pageSize=200`,
      { next: { revalidate: 3600 } }
    );
    let productRoutes: any[] = [];
    if (productsRes.ok) {
      const data = await productsRes.json();
      productRoutes = (data.documents || []).map((doc: any) => {
        const id = doc.name.split('/').pop();
        return {
          url: `${siteUrl}/products/${id}`,
          lastModified: new Date(doc.updateTime),
          changeFrequency: 'weekly' as const,
          priority: 0.9,
        };
      });
    }

    // 2. Fetch Blog Posts
    const blogRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/blog_posts?pageSize=100`,
      { next: { revalidate: 3600 } }
    );
    let blogRoutes: any[] = [];
    if (blogRes.ok) {
      const data = await blogRes.json();
      blogRoutes = (data.documents || [])
        .filter((doc: any) => doc.fields?.status?.stringValue === 'published')
        .map((doc: any) => {
          const slug = doc.fields?.slug?.stringValue;
          return {
            url: `${siteUrl}/blog/${slug}`,
            lastModified: new Date(doc.updateTime),
            changeFrequency: 'monthly' as const,
            priority: 0.7,
          };
        });
    }

    // 3. Fetch Categories
    const catRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/categories?pageSize=50`,
      { next: { revalidate: 3600 } }
    );
    let catRoutes: any[] = [];
    if (catRes.ok) {
      const data = await catRes.json();
      catRoutes = (data.documents || []).map((doc: any) => {
        const slug = doc.fields?.slug?.stringValue;
        return {
          url: `${siteUrl}/products?category=${slug}`,
          lastModified: new Date(doc.updateTime),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        };
      });
    }

    return [...staticRoutes, ...productRoutes, ...blogRoutes, ...catRoutes];
  } catch (error) {
    console.error('Sitemap fetch failed, using static only');
    return staticRoutes;
  }
}
