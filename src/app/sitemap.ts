
import { MetadataRoute } from 'next';
import { firebaseConfig } from '@/firebase/config';

/**
 * @fileOverview Automatic Sitemap Generator
 * Uses Firestore REST API to avoid SDK authentication overhead during build/crawl.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';
  const projectId = firebaseConfig.projectId;
  
  try {
    // 1. Core static routes
    const routes = [
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

    // 2. Fetch all products via REST
    const productsRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products?pageSize=100`,
      { next: { revalidate: 3600 } }
    );

    if (productsRes.ok) {
      const productsData = await productsRes.json();
      const productRoutes = (productsData.documents || []).map((doc: any) => {
        const id = doc.name.split('/').pop();
        return {
          url: `${siteUrl}/products/${id}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        };
      });
      routes.push(...productRoutes);
    }

    // 3. Fetch all published blog posts via REST
    const blogRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/blog_posts?pageSize=50`,
      { next: { revalidate: 3600 } }
    );

    if (blogRes.ok) {
      const blogData = await blogRes.json();
      const blogRoutes = (blogData.documents || [])
        .filter((doc: any) => doc.fields?.status?.stringValue === 'published')
        .map((doc: any) => {
          const slug = doc.fields?.slug?.stringValue;
          return {
            url: `${siteUrl}/blog/${slug}`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.6,
          };
        });
      routes.push(...blogRoutes);
    }

    return routes;
  } catch (error) {
    console.error('Sitemap generation failed, falling back to static:', error);
    return [
      { url: siteUrl, lastModified: new Date(), priority: 1 },
      { url: `${siteUrl}/products`, lastModified: new Date(), priority: 0.8 },
      { url: `${siteUrl}/blog`, lastModified: new Date(), priority: 0.8 },
    ];
  }
}
