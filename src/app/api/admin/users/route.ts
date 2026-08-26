import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { desc, eq, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** GET /api/admin/users — all users (admin) */
export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select().from(users).orderBy(desc(users.createdAt));
    return NextResponse.json({ success: true, data: rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

/** PATCH /api/admin/users — { uid, isActive? , role? } */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.uid) return NextResponse.json({ success: false, error: 'uid required' }, { status: 400 });
    const db = getDb();
    const [row] = await db
      .update(users)
      .set({
        isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined,
        role: body.role ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(users.uid, body.uid))
      .returning();
    if (!row) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: row });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
