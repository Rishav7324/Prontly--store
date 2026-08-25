import { NextResponse } from 'next/server';
import { isDatabaseConfigured, getDb } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products — SQL first, Firestore fallback
 * Returns products normalized for frontend ProductGrid / admin
 */
export async function GET() {
  try {
    if (isDatabaseConfigured()) {
      const db = getDb();
      const rows = await db.select().from(products);
      const data = rows.map((p: any) => ({
        id: p.id,
        firestoreId: p.firestoreId,
        slug: p.slug,
        name: p.name,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        categorySlug: p.categorySlug,
        categoryId: p.categoryId,
        images: p.images,
        averageRating: (p.averageRating ?? 50) / 10,
        salesCount: p.salesCount,
        reviewCount: p.reviewCount,
        shortDescription: p.shortDescription,
        description: p.description,
        isPublished: p.isPublished,
        isFeatured: p.isFeatured,
        fileKey: p.fileKey,
        createdAt: p.createdAt?.toISOString(),
        updatedAt: p.updatedAt?.toISOString(),
      }));
      return NextResponse.json({ success: true, data });
    }

    // Firestore fallback — use REST for server-side
    const db = getAdminDb();
    const snap = await db.collection('products').get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ success: true, data, source: 'firestore' });
  } catch (e: any) {
    console.error('[API/products]', e.message);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
