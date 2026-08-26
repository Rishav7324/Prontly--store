import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth/verify';
import { getDb } from '@/lib/db';
import { orders, orderItems, products } from '@/lib/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** GET /api/user/orders — orders + items + product info for token uid */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuthToken(req.headers.get('authorization'));
    const db = getDb();
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, user.uid))
      .orderBy(desc(orders.createdAt));
    if (rows.length === 0) return NextResponse.json({ success: true, data: [] });

    const ids = rows.map((r) => r.id);
    const items = await db.select().from(orderItems).where(inArray(orderItems.orderId, ids));

    const data = rows.map((o) => ({
      ...o,
      items: items.filter((i) => i.orderId === o.id),
    }));
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
