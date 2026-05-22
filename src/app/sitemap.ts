import { MetadataRoute } from 'next';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';
  const { db } = initializeFirebase();

  // Static routes
  const routes = [
    '',
    '/products',
    '/blog',
    '/about',
    '/contact',
    '/faq',
    '/terms',
    '/privacy',
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Dynamic products
  let productRoutes: any[] = [];
  try {
    const productsSnapshot = await getDocs(
      query(collection(db, 'products'), where('isPublished', '==', true))
    );
    productRoutes = productsSnapshot.docs.map((doc) => ({
      url: `${siteUrl}/products/${doc.id}`,
      lastModified: doc.data().updatedAt?.toDate() || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (e) {
    console.error('Sitemap product fetch failed', e);
  }

  // Dynamic categories
  let categoryRoutes: any[] = [];
  try {
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    categoryRoutes = categoriesSnapshot.docs.map((doc) => ({
      url: `${siteUrl}/products?category=${doc.data().slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (e) {
    console.error('Sitemap category fetch failed', e);
  }

  return [...routes, ...productRoutes, ...categoryRoutes];
}
