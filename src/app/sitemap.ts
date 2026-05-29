import { MetadataRoute } from 'next';
import { getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

/**
 * @fileOverview Automatic Sitemap Generator
 * Fetches all dynamic content from Firestore using Admin SDK for reliability.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';
  // Remove trailing slash if present to prevent double slashes in URLs
  const siteUrl = rawSiteUrl.endsWith('/') ? rawSiteUrl.slice(0, -1) : rawSiteUrl;
  
  const staticRoutes: MetadataRoute.Sitemap = [
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
    changeFrequency: 'daily',
    priority: route === '' ? 1.0 : 0.8,
  }));

  try {
    // Database initialization inside try block to catch potential auth/env errors
    const db = getAdminDb();
    
    // 1. Fetch Products with SLUGS
    const productsSnap = await db.collection('products').select('slug', 'updatedAt').get();
    const productRoutes = productsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        url: `${siteUrl}/products/${data.slug || doc.id}`,
        lastModified: data.updatedAt?.toDate() || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      };
    });

    // 2. Fetch Blog Posts
    const blogSnap = await db.collection('blog_posts')
      .where('status', '==', 'published')
      .select('slug', 'updatedAt', 'publishedAt')
      .get();
    
    const blogRoutes = blogSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        url: `${siteUrl}/blog/${data.slug}`,
        lastModified: data.updatedAt?.toDate() || data.publishedAt?.toDate() || new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      };
    });

    // 3. Fetch Categories
    const catSnap = await db.collection('categories').select('slug').get();
    const catRoutes = catSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        url: `${siteUrl}/products?category=${data.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      };
    });

    return [...staticRoutes, ...productRoutes, ...blogRoutes, ...catRoutes];
  } catch (error) {
    console.error('[SITEMAP_ERROR]: Generation failed:', error);
    // Fallback to static routes to avoid 500 error during crawler fetch
    return staticRoutes;
  }
}
