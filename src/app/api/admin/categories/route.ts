import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { categories, products } from '@/lib/db/schema';
import { eq, asc, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** GET /api/admin/categories — all categories with live product counts */
export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select().from(categories).orderBy(asc(categories.name));
    const counts = await db
      .select({ slug: products.categorySlug, c: sql<number>`count(*)::int` })
      .from(products)
      .groupBy(products.categorySlug);
    const map = new Map(counts.map((c) => [c.slug, c.c]));
    return NextResponse.json({
      success: true,
      data: rows.map((r) => ({ ...r, productCount: Number(map.get(r.slug) || 0) })),
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

/** POST /api/admin/categories — { name, iconEmoji?, description? } */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name) return NextResponse.json({ success: false, error: 'name required' }, { status: 400 });
    const db = getDb();
    const [row] = await db
      .insert(categories)
      .values({
        name: body.name,
        slug: body.slug || body.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        iconEmoji: body.iconEmoji || '📦',
        description: body.description || null,
      })
      .onConflictDoNothing()
      .returning();
    return NextResponse.json({ success: true, data: row ?? null });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

/** PATCH /api/admin/categories — { id, name?, iconEmoji?, description? } */
export async function PATCH(req: NextRequest) {
  try {
    const b = await req.json();
    if (!b.id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    const db = getDb();
    const set: any = { updatedAt: new Date() };
    if (b.name) { set.name = b.name; set.slug = b.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
    if (b.iconEmoji !== undefined) set.iconEmoji = b.iconEmoji;
    if (b.description !== undefined) set.description = b.description;
    const [row] = await db.update(categories).set(set).where(eq(categories.id, b.id)).returning();
    return NextResponse.json({ success: true, data: row });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

/** DELETE /api/admin/categories?id= */
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false }, { status: 400 });
    const db = getDb();
    await db.delete(categories).where(eq(categories.id, id as any));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
