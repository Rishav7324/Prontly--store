import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { blogPosts } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/verify';

export const dynamic = 'force-dynamic';

/** GET /api/blog — published posts (public). */
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const slug = req.nextUrl.searchParams.get('slug');
    if (slug) {
      const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
      if (!post || post.status !== 'published')
        return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: post });
    }
    const rows = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'))
      .orderBy(desc(blogPosts.publishedAt));
    return NextResponse.json({ success: true, data: rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

function cleanSlug(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

/** POST /api/blog — admin create */
export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req.headers.get('authorization'));
    const body = await req.json();
    const db = getDb();
    const [row] = await db
      .insert(blogPosts)
      .values({
        title: body.title || 'Untitled',
        slug: cleanSlug(body.slug || body.title || `post-${Date.now()}`),
        content: body.content || '',
        excerpt: body.excerpt || null,
        featuredImage: body.featuredImage || null,
        authorName: body.authorName || null,
        categoryId: body.categoryId && /^[0-9a-f-]{36}$/i.test(body.categoryId) ? body.categoryId : null,
        tags: Array.isArray(body.tags) ? body.tags : String(body.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean),
        status: body.status === 'published' ? 'published' : 'draft',
        publishedAt: body.status === 'published' ? new Date() : null,
      })
      .returning();
    return NextResponse.json({ success: true, data: row });
  } catch (e: any) {
    const status = e.message?.includes('UNAUTHORIZED') ? 401 : e.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: e.message }, { status });
  }
}

/** PUT /api/blog?id= — admin update */
export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req.headers.get('authorization'));
    const id = req.nextUrl.searchParams.get('firestoreId') || undefined;
    const body = await req.json();
    const db = getDb();
    let target = id ? (await db.select().from(blogPosts).where(eq(blogPosts.firestoreId, id)).limit(1))[0] : null;
    if (!target && body.slug) target = (await db.select().from(blogPosts).where(eq(blogPosts.slug, body.slug)).limit(1))[0];
    if (!target) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

    const [row] = await db
      .update(blogPosts)
      .set({
        title: body.title ?? target.title,
        content: body.content ?? target.content,
        excerpt: body.excerpt ?? target.excerpt,
        featuredImage: body.featuredImage ?? target.featuredImage,
        authorName: body.authorName ?? target.authorName,
        categoryId: body.categoryId ?? target.categoryId,
        tags: Array.isArray(body.tags) ? body.tags : String(body.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean),
        status: body.status === 'published' ? 'published' : 'draft',
        publishedAt: body.status === 'published' ? target.publishedAt ?? new Date() : target.publishedAt,
        updatedAt: new Date(),
      })
      .where(eq(blogPosts.id, target.id))
      .returning();
    return NextResponse.json({ success: true, data: row });
  } catch (e: any) {
    const status = e.message?.includes('UNAUTHORIZED') ? 401 : e.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: e.message }, { status });
  }
}

/** DELETE /api/blog?id=<firestore_id|uuid> */
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin(req.headers.get('authorization'));
    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ success: false }, { status: 400 });
    const db = getDb();
    await db.delete(blogPosts).where(eq(blogPosts.firestoreId, id));
    await db.delete(blogPosts).where(eq(blogPosts.id, id as any));
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const status = e.message?.includes('UNAUTHORIZED') ? 401 : e.message?.includes('FORBIDDEN') ? 403 : 500;
    return NextResponse.json({ success: false, error: e.message }, { status });
  }
}
