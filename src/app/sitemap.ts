import { MetadataRoute } from 'next';
import { getAdminDb } from '@/lib/firebase-admin';

/**
 * @fileOverview Automatic Sitemap Generator
 * Fetches all dynamic content from Firestore using Admin SDK for reliability.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';
  const db = getAdminDb();
  
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
    return staticRoutes;
  }
}
