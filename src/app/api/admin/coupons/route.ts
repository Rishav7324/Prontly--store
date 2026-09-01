import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { coupons } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/verify';

export const dynamic = 'force-dynamic';

/** GET /api/admin/coupons */
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req.headers.get('authorization'));
    const db = getDb();
    const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
    return NextResponse.json({ success: true, data: rows });
  } catch (e: any) {
    const status = e.message?.includes('UNAUTHORIZED') ? 401 : e.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: e.message }, { status });
  }
}

/** POST /api/admin/coupons — { code, type, value, expiresAt? } (amounts in paise) */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req.headers.get('authorization'));
    const b = await req.json();
    if (!b.code || b.value === undefined)
      return NextResponse.json({ success: false, error: 'code and value required' }, { status: 400 });
    const db = getDb();
    const [row] = await db
      .insert(coupons)
      .values({
        code: String(b.code).toUpperCase().trim(),
        type: b.type === 'fixed' ? 'fixed' : 'percentage',
        value: Number(b.value),
        minOrderAmount: Number(b.minOrderAmount || 0),
        maxUsageCount: b.maxUsageCount ? Number(b.maxUsageCount) : null,
        isActive: true,
        expiresAt: b.expiresAt ? new Date(b.expiresAt) : null,
      })
      .onConflictDoNothing()
      .returning();
    return NextResponse.json({ success: !!row, data: row ?? null });
  } catch (e: any) {
    const status = e.message?.includes('UNAUTHORIZED') ? 401 : e.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: e.message }, { status });
  }
}

/** DELETE /api/admin/coupons?id= */
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req.headers.get('authorization'));
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false }, { status: 400 });
    const db = getDb();
    await db.delete(coupons).where(eq(coupons.id, id as any));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const status = e.message?.includes('UNAUTHORIZED') ? 401 : e.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: e.message }, { status });
  }
}
