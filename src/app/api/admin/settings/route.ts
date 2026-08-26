import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { siteSettings, newsletterSubscribers } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** GET /api/admin/settings?subscribers=1 — settings row + optional subscriber list */
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, 'main')).limit(1);
    let subscribers: any[] = [];
    if (req.nextUrl.searchParams.get('subscribers')) {
      subscribers = await db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt));
    }
    return NextResponse.json({ success: true, data: row ?? null, subscribers });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

/** PUT /api/admin/settings — merge top-level fields into main row */
export async function PUT(req: NextRequest) {
  try {
    const b = await req.json();
    const db = getDb();
    const allowed = [
      'siteName', 'siteDescription', 'logoUrl', 'faviconUrl', 'contactEmail',
      'gstNumber', 'razorpayKeyId', 'maintenanceMode', 'invoiceSettings',
      'emailSettings', 'socialLinks',
    ];
    const set: any = { updatedAt: new Date() };
    for (const k of allowed) if (b[k] !== undefined) set[k] = b[k];
    const [row] = await db
      .insert(siteSettings)
      .values({ id: 'main', ...set })
      .onConflictDoUpdate({ target: siteSettings.id, set })
      .returning();
    return NextResponse.json({ success: true, data: row });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

/** DELETE /api/admin/settings?email= — remove newsletter subscriber */
export async function DELETE(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get('email');
    if (!email) return NextResponse.json({ success: false }, { status: 400 });
    const db = getDb();
    await db.delete(newsletterSubscribers).where(eq(newsletterSubscribers.email, email.toLowerCase()));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
