import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    const list = await db
      .select()
      .from(products)
      .where(eq(products.isPublished, false))
      .orderBy(desc(products.createdAt));

    return NextResponse.json({ success: true, data: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, isPublished, action } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
    }

    const db = getDb();
    if (action === 'delete') {
      await db.delete(products).where(eq(products.id, id));
      return NextResponse.json({ success: true, message: 'Submission rejected and removed.' });
    }

    const [updated] = await db
      .update(products)
      .set({ isPublished: Boolean(isPublished), updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
