/**
 * Shared SQL helpers — normalize Firestore-like shapes for frontend
 */

import { getDb } from '@/lib/db';
import { products, categories, reviews, orders, orderItems, users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function getProductBySlugSql(slug: string) {
  const db = getDb();
  const [p] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  if (p) return normalizeProduct(p);
  const [byId] = await db.select().from(products).where(eq(products.id, slug as any)).limit(1);
  return byId ? normalizeProduct(byId) : null;
}

export function normalizeProduct(p: any) {
  return {
    id: p.id,
    firestoreId: p.firestoreId,
    slug: p.slug,
    name: p.name,
    description: p.description,
    shortDescription: p.shortDescription,
    categoryId: p.categoryId,
    categorySlug: p.categorySlug,
    tags: p.tags,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    images: p.images,
    bannerImage: p.bannerImage,
    fileKey: p.fileKey,
    previewFileKey: p.previewFileKey,
    fileSize: p.fileSize,
    fileFormat: p.fileFormat,
    fileVersion: p.fileVersion,
    isPublished: p.isPublished,
    isFeatured: p.isFeatured,
    salesCount: p.salesCount,
    averageRating: (p.averageRating ?? 50) / 10,
    reviewCount: p.reviewCount,
    seo: p.seo,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export async function getProductsForHomepageSql() {
  const db = getDb();
  const [cats, prods] = await Promise.all([db.select().from(categories), db.select().from(products)]);
  return { categories: cats, products: prods.map(normalizeProduct) };
}
