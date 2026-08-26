import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth/verify';
import { getDb } from '@/lib/db';
import { users, orders, orderItems } from '@/lib/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** GET /api/user/me — profile for token uid */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuthToken(req.headers.get('authorization'));
    const db = getDb();
    const [row] = await db.select().from(users).where(eq(users.uid, user.uid)).limit(1);
    if (!row) return NextResponse.json({ success: true, data: null });
    const { email: _e, ...safe } = row;
    return NextResponse.json({ success: true, data: { ...safe, photoURL: safe.photoUrl } });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 401 });
  }
}

/** POST /api/user/me — update displayName/photo */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuthToken(req.headers.get('authorization'));
    const body = await req.json();
    const db = getDb();
    await db
      .update(users)
      .set({
        displayName: body.displayName ?? undefined,
        photoUrl: body.photoURL ?? undefined,
        phone: body.phone ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(users.uid, user.uid));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
