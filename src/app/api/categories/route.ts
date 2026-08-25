import { NextResponse } from 'next/server';
import { isDatabaseConfigured, getDb } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (isDatabaseConfigured()) {
      const db = getDb();
      const rows = await db.select().from(categories);
      return NextResponse.json({ success: true, data: rows });
    }
    const db = getAdminDb();
    const snap = await db.collection('categories').get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ success: true, data, source: 'firestore' });
  } catch (e: any) {
    console.error('[API/categories]', e.message);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
