import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { reviews, products } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** GET /api/reviews?productId=<uuid|firestoreId|slug> */
export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('productId');
  if (!productId) return NextResponse.json({ success: false, error: 'productId required' }, { status: 400 });
  try {
    const db = getDb();
    let pid: any = productId;
    if (!/^[0-9a-f-]{36}$/i.test(productId)) {
      const [p] = await db.select({ id: products.id }).from(products).where(eq(products.firestoreId, productId)).limit(1);
      pid = p?.id ?? productId;
    }
    const rows = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.productId, pid), eq(reviews.isApproved, true)))
      .orderBy(desc(reviews.createdAt));
    return NextResponse.json({ success: true, data: rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

/** POST /api/reviews — create review + recompute product rating */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, userId, userName, userAvatar, rating, comment } = body;
    if (!productId || !userId || !rating) {
      return NextResponse.json({ success: false, error: 'productId, userId, rating required' }, { status: 400 });
    }
    const db = getDb();
    // Resolve product uuid
    let pid: any = productId;
    if (!/^[0-9a-f-]{36}$/i.test(String(productId))) {
      const [p] = await db.select().from(products).where(eq(products.firestoreId, String(productId))).limit(1);
      if (p) pid = p.id;
    }

    const cleanUserName = String(userName || 'Verified User').trim().slice(0, 60);
    const cleanComment = String(comment || '').trim().slice(0, 1000);
    const cleanRating = Math.min(5, Math.max(1, Math.round(Number(rating))));

    const [row] = await db
      .insert(reviews)
      .values({
        productId: pid,
        userId: String(userId).slice(0, 128),
        userName: cleanUserName,
        userAvatar: userAvatar ? String(userAvatar).slice(0, 500) : null,
        rating: cleanRating,
        comment: cleanComment,
        isApproved: true,
      })
      .returning();

    // Recompute aggregate from source of truth
    const agg = await db
      .select({
        count: sql<number>`count(*)::int`,
        avg: sql<number>`coalesce(avg(rating),0)`,
      })
      .from(reviews)
      .where(and(eq(reviews.productId, pid), eq(reviews.isApproved, true)));

    const reviewCount = agg[0]?.count ?? 0;
    const averageRating10 = Math.round((agg[0]?.avg ?? 0) * 10);
    await db
      .update(products)
      .set({ reviewCount, averageRating: averageRating10 })
      .where(eq(products.id, pid));

    return NextResponse.json({ success: true, data: row });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
