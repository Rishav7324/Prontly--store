import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { adminLogs } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { adminId, adminEmail, action, resourceType, resourceId, details } = await req.json();
    await getDb().insert(adminLogs).values({
      adminId,
      adminEmail,
      action: action as any,
      resourceType: resourceType as any,
      resourceId,
      details,
    });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const rows = await getDb().select().from(adminLogs).orderBy(desc(adminLogs.timestamp)).limit(100);
    return NextResponse.json({ success: true, data: rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
