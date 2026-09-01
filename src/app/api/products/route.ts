import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured, getDb } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/verify';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products — SQL first, Firestore fallback
 * Returns products normalized for frontend ProductGrid / admin
 */
export async function GET(req: NextRequest) {
  try {
    if (isDatabaseConfigured()) {
      const db = getDb();
      const idsParam = req.nextUrl.searchParams.get('ids');
    const rows = idsParam
      ? await db.select().from(products).where(sql`${products.id} = ANY(${idsParam.split(',')}::uuid[])`)
      : await db.select().from(products);
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

    // Firestore fallback removed — Neon is the single source of truth
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
  } catch (e: any) {
    console.error('[API/products]', e.message);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

/** POST /api/products — admin create (ProductForm) */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req.headers.get('authorization'));
    const b = await req.json();
    const db = getDb();
    const slug = (b.slug || b.name || 'product').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let categoryId: string | null = null;
    if (b.categoryId && /^[0-9a-f-]{36}$/i.test(b.categoryId)) categoryId = b.categoryId;
    else if (b.categorySlug) {
      const cats = await getDb().execute(sql`SELECT id FROM categories WHERE slug = ${b.categorySlug} LIMIT 1`);
      categoryId = (cats as any).rows?.[0]?.id || null;
    }
    const values: any = {
      name: b.name || 'Untitled',
      slug,
      description: b.description || '',
      shortDescription: b.shortDescription || null,
      categoryId,
      categorySlug: b.categorySlug || 'asset',
      tags: Array.isArray(b.tags) ? b.tags : [],
      price: Math.round(Number(b.price) * 100),
      compareAtPrice: Math.round(Number(b.compareAtPrice || 0) * 100),
      images: Array.isArray(b.images) ? b.images : [],
      bannerImage: b.bannerImage || null,
      fileKey: b.fileKey ? String(b.fileKey).replace(/^https?:\/\/[^/]+\//, '') : null,
      previewFileKey: b.previewFileKey ? String(b.previewFileKey).replace(/^https?:\/\/[^/]+\//, '') : null,
      fileFormat: (b.fileFormat || 'ZIP'),
      fileVersion: b.fileVersion || '1.0',
      isPublished: b.isPublished ?? true,
      isFeatured: !!b.isFeatured,
    };
    const [row] = await db.insert(products).values(values).onConflictDoUpdate({
      target: products.slug,
      set: { ...values, updatedAt: new Date() },
    }).returning();
    return NextResponse.json({ success: true, data: row });
  } catch (e: any) {
    const status = e.message?.includes('UNAUTHORIZED') ? 401 : e.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: e.message }, { status });
  }
}
