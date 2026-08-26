import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth/verify';
import { getDb } from '@/lib/db';
import { downloads } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** GET /api/user/downloads — entitlements for token uid (fileKey stripped) */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuthToken(req.headers.get('authorization'));
    const db = getDb();
    const rows = await db
      .select()
      .from(downloads)
      .where(eq(downloads.userId, user.uid))
      .orderBy(desc(downloads.purchasedAt));

    const data = rows.map((r) => {
      const { fileKey: _fk, ...safe } = r;
      return {
        ...safe,
        purchasedAt: safe.purchasedAt ? new Date(safe.purchasedAt).toISOString() : null,
        lastDownloadedAt: safe.lastDownloadedAt ? new Date(safe.lastDownloadedAt).toISOString() : null,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    console.error('[FETCH_LIBRARY_ERROR]:', e.message);
    return NextResponse.json({ success: false, error: 'Vault Synchronization Error' }, { status: 500 });
  }
}
