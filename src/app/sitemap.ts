import { MetadataRoute } from 'next';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Initialize Firebase Admin safely for Edge/Serverless execution
 */
function getAdminDb() {
  if (getApps().length === 0) {
    initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-2478374494-a2ee0',
    });
  }
  return getFirestore();
}

/**
 * @fileOverview Automatic Sitemap Generator
 * Fetches products and blog posts directly from Firestore to ensure
 * Google always has the latest index of your marketplace.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';
  
  try {
    const db = getAdminDb();

    // 1. Core static routes
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

    // 2. Fetch all active products
    const productsSnap = await db.collection('products').get();
    const productRoutes = productsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        url: `${siteUrl}/products/${doc.id}`,
        lastModified: data.updatedAt?.toDate() || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      };
    });

    // 3. Fetch all published blog posts
    const blogSnap = await db.collection('blog_posts').where('status', '==', 'published').get();
    const blogRoutes = blogSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        url: `${siteUrl}/blog/${data.slug}`,
        lastModified: data.updatedAt?.toDate() || new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      };
    });

    return [...staticRoutes, ...productRoutes, ...blogRoutes];
  } catch (error) {
    console.error('Sitemap generation failed, falling back to static:', error);
    // Fallback if DB connection fails during build
    return [
      { url: siteUrl, lastModified: new Date(), priority: 1 },
      { url: `${siteUrl}/products`, lastModified: new Date(), priority: 0.8 },
      { url: `${siteUrl}/blog`, lastModified: new Date(), priority: 0.8 },
    ];
  }
}
