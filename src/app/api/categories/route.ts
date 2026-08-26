import { NextResponse } from 'next/server';
import { isDatabaseConfigured, getDb } from '@/lib/db';
import { categories } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (isDatabaseConfigured()) {
      const db = getDb();
      const rows = await db.select().from(categories);
      return NextResponse.json({ success: true, data: rows });
    }
    return NextResponse.json({ success: false, error: 'Database not configured' }, { status: 503 });
  } catch (e: any) {
    console.error('[API/categories]', e.message);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
