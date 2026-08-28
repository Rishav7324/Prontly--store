import { NextRequest, NextResponse } from 'next/server';
import { isDatabaseConfigured, getDb } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    const db = getDb();
    if (userId) {
      const userProducts = await db
        .select()
        .from(products)
        .where(eq(products.createdBy, userId))
        .orderBy(desc(products.createdAt));

      return NextResponse.json({ success: true, data: userProducts });
    }

    const all = await db.select().from(products).orderBy(desc(products.createdAt));
    return NextResponse.json({ success: true, data: all });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      categorySlug,
      price, // in rupees from user, convert to paise
      shortDescription,
      description,
      images = [],
      fileFormat = 'PROMPT_TXT',
      tags = [],
      userId,
      userEmail,
    } = body;

    if (!name || !price || !categorySlug) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const slug = `${name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')}-${Date.now().toString().slice(-4)}`;

    const priceInPaise = Math.round(Number(price) * 100);

    const submissionData = {
      name,
      slug,
      categorySlug,
      price: priceInPaise,
      shortDescription: shortDescription || '',
      description: description || '',
      images: Array.isArray(images) && images.length > 0 ? images : ['https://picsum.photos/seed/' + slug + '/800/600'],
      fileFormat,
      tags: [...tags, 'creator_submission', ...(userEmail ? [`creator:${userEmail}`] : [])],
      isPublished: false, // Pending admin approval
      createdBy: userId || null,
      salesCount: 0,
      downloadCount: 0,
      averageRating: 50,
      reviewCount: 0,
    };

    const db = getDb();
    const [inserted] = await db.insert(products).values(submissionData as any).returning();
    return NextResponse.json({ success: true, data: inserted, message: 'Submission received for review.' });
  } catch (error: any) {
    console.error('[SUBMISSION_POST_ERR]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
