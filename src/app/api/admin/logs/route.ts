import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured, getDb } from '@/lib/db';
import { adminLogs } from '@/lib/db/schema';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminId, adminEmail, action, resourceType, resourceId, details } = body;

    if (isDatabaseConfigured()) {
      const db = getDb();
      await db.insert(adminLogs).values({
        adminId,
        adminEmail,
        action: action as any,
        resourceType: resourceType as any,
        resourceId,
        details,
      });
      return NextResponse.json({ success: true, source: 'neon' });
    }

    const db = getAdminDb();
    await db.collection('admin_logs').add({
      adminId,
      adminEmail,
      action,
      resourceType,
      resourceId,
      details,
      timestamp: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ success: true, source: 'firestore' });
  } catch (e: any) {
    console.error('[API/admin/logs]', e.message);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (isDatabaseConfigured()) {
      const db = getDb();
      const rows = await db.select().from(adminLogs);
      return NextResponse.json({ success: true, data: rows });
    }
    const db = getAdminDb();
    const snap = await db.collection('admin_logs').limit(50).get();
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
