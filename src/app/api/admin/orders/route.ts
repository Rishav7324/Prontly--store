import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { orders, orderItems, products, users, siteSettings } from '@/lib/db/schema';
import { eq, desc, inArray, sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/verify';

export const dynamic = 'force-dynamic';

/** GET /api/admin/orders — all orders with items (admin) */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req.headers.get('authorization'));
    const db = getDb();
    const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
    if (rows.length === 0) return NextResponse.json({ success: true, data: [] });
    const ids = rows.map((r) => r.id);
    const items = await db.select().from(orderItems).where(inArray(orderItems.orderId, ids));
    return NextResponse.json({
      success: true,
      data: rows.map((o) => ({ ...o, items: items.filter((i) => i.orderId === o.id) })),
    });
  } catch (e: any) {
    const status = e.message?.includes('UNAUTHORIZED') ? 401 : e.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: e.message }, { status });
  }
}

/** PATCH /api/admin/orders — { id, status } update + refund email side-effect handled client-side or here later */
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin(req.headers.get('authorization'));
    const body = await req.json();
    if (!body.id || !body.status) {
      return NextResponse.json({ success: false, error: 'id and status required' }, { status: 400 });
    }
    const db = getDb();
    const [row] = await db
      .update(orders)
      .set({
        status: body.status,
        refundedAt: body.status === 'refunded' ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, body.id))
      .returning();
    if (!row) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: row });
  } catch (e: any) {
    const status = e.message?.includes('UNAUTHORIZED') ? 401 : e.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: e.message }, { status });
  }
}
