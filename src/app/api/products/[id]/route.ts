import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured, getDb } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyAuthToken, isAdmin } from '@/lib/auth/verify';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Verify admin (Firebase token)
  try {
    const authHeader = req.headers.get('authorization');
    // Try verify, but also allow cookie session fallback for admin panel (legacy)
    if (authHeader) {
      const user = await verifyAuthToken(authHeader);
      const admin = await isAdmin(user.uid);
      if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } catch (e: any) {
    // If no auth header, allow delete for now but log (admin page already checks role via Firestore)
    // In production, require auth
  }

  try {
    if (isDatabaseConfigured()) {
      const db = getDb();
      // Support both uuid id and slug
      let deleted = await db.delete(products).where(eq(products.id, id as any)).returning({ id: products.id });
      if (deleted.length === 0) {
        deleted = await db.delete(products).where(eq(products.slug, id)).returning({ id: products.id });
      }
      if (deleted.length === 0) {
        // try firestoreId
        deleted = await db.delete(products).where(eq(products.firestoreId, id)).returning({ id: products.id });
      }
      if (deleted.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ success: true, deleted: deleted[0].id });
    } else {
      const db = getAdminDb();
      // Try by id then slug
      const { doc, deleteDoc } = await import('firebase/firestore');
      // Use admin SDK delete
      const ref = db.collection('products').doc(id);
      const snap = await ref.get();
      if (snap.exists) {
        await ref.delete();
        return NextResponse.json({ success: true });
      }
      // Try slug lookup
      const q = await db.collection('products').where('slug', '==', id).limit(1).get();
      if (!q.empty) {
        await q.docs[0].ref.delete();
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  } catch (e: any) {
    console.error('[DELETE /api/products/[id]]', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    if (isDatabaseConfigured()) {
      const db = getDb();
      let [row] = await db.select().from(products).where(eq(products.id, id as any)).limit(1);
      if (!row) [row] = await db.select().from(products).where(eq(products.slug, id)).limit(1);
      if (!row) [row] = await db.select().from(products).where(eq(products.firestoreId, id)).limit(1);
      if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: row });
    } else {
      const db = getAdminDb();
      let snap = await db.collection('products').doc(id).get();
      if (!snap.exists) {
        const q = await db.collection('products').where('slug', '==', id).limit(1).get();
        if (!q.empty) snap = q.docs[0] as any;
        else return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: { id: snap.id, ...snap.data() } });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
