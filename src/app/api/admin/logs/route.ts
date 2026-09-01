import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { adminLogs } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/verify';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req.headers.get('authorization'));
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
    const status = e.message?.includes('UNAUTHORIZED') ? 401 : e.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: e.message }, { status });
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req.headers.get('authorization'));
    const rows = await getDb().select().from(adminLogs).orderBy(desc(adminLogs.timestamp)).limit(100);
    return NextResponse.json({ success: true, data: rows });
  } catch (e: any) {
    const status = e.message?.includes('UNAUTHORIZED') ? 401 : e.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: e.message }, { status });
  }
}
