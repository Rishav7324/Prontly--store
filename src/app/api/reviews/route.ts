import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured, getDb } from '@/lib/db';
import { reviews } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('productId');
  if (!productId) return NextResponse.json({ success: false, error: 'productId required' }, { status: 400 });

  try {
    if (isDatabaseConfigured()) {
      const db = getDb();
      const rows = await db.select().from(reviews).where(eq(reviews.productId, productId as any));
      return NextResponse.json({ success: true, data: rows });
    }
    const db = getAdminDb();
    // Firestore: productId may be firestore string id, try both
    const snap = await db.collection('reviews').where('productId', '==', productId).get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    console.error('[API/reviews]', e.message);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
