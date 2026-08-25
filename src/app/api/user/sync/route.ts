import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { isDatabaseConfigured, getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/user/sync — ensure Firebase user exists in Neon users table
 * Called after signup/login from client. Idempotent.
 * Body: { uid, email, displayName, photoURL }
 * Auth: Bearer Firebase ID token (verifies uid matches)
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') ?? '';
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(token);
    const body = await req.json();
    const { uid, email, displayName, photoURL } = body;

    // Security: uid must match token
    if (uid !== decoded.uid) {
      return NextResponse.json({ error: 'UID mismatch' }, { status: 403 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ success: true, source: 'firestore-only', message: 'DATABASE_URL not set, skipping Neon sync' });
    }

    const db = getDb();
    const [existing] = await db.select().from(users).where(eq(users.uid, uid)).limit(1);

    if (existing) {
      // Update displayName/photo if changed, touch updatedAt
      await db
        .update(users)
        .set({
          displayName: displayName || existing.displayName,
          photoUrl: photoURL || existing.photoUrl,
          email: email || existing.email,
          updatedAt: new Date() as any,
          lastLoginAt: new Date() as any,
        })
        .where(eq(users.uid, uid));
      return NextResponse.json({ success: true, synced: true, created: false });
    }

    await db.insert(users).values({
      uid,
      email: (email || decoded.email || `${uid}@unknown.local`).toLowerCase(),
      displayName: displayName || decoded.name || 'Creator',
      photoUrl: photoURL || null,
      role: 'customer',
      isActive: true,
      totalSpent: 0,
      orderCount: 0,
    });

    return NextResponse.json({ success: true, synced: true, created: true });
  } catch (e: any) {
    console.error('[USER_SYNC]', e.message);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
