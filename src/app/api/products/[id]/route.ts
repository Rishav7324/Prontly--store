import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAuthToken, isAdmin } from '@/lib/auth/verify';

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

async function resolveProduct(id: string) {
  const db = getDb();
  if (isUuid(id)) {
    const [row] = await db.select().from(products).where(eq(products.id, id as any)).limit(1);
    if (row) return row;
  }
  let [row] = await db.select().from(products).where(eq(products.slug, id)).limit(1);
  if (row) return row;
  [row] = await db.select().from(products).where(eq(products.firestoreId, id)).limit(1);
  return row ?? null;
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const user = await verifyAuthToken(req.headers.get('authorization'));
    const admin = await isAdmin(user.uid);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const target = await resolveProduct(id);
    if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await getDb().delete(products).where(eq(products.id, target.id));
    return NextResponse.json({ success: true, deleted: target.id });
  } catch (e: any) {
    console.error('[DELETE /api/products/[id]]', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const row = await resolveProduct(id);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: row });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
