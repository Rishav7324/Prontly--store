import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth/verify';
import { z } from 'zod';
import { checkDownloadRateLimits } from '@/lib/redis/downloadRateLimit';
import { generateSignedDownloadUrl } from '@/lib/r2/signedUrl';
import type { GenerateDownloadUrlResponse } from '@/types/download';
import { getDb, getPgDb } from '@/lib/db';
import {
  downloads as downloadsTable,
  downloadLogs,
  products as productsTable,
} from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';

const bodySchema = z.object({
  orderId: z.string().min(1).max(200),
  productId: z.string().min(1).max(100),
});

/**
 * Secure Digital Asset Download Terminal (Neon SQL + R2 signed URLs).
 */
export async function POST(
  req: NextRequest
): Promise<NextResponse<GenerateDownloadUrlResponse>> {
  // 1. Auth
  let uid: string;
  try {
    const user = await verifyAuthToken(req.headers.get('authorization'));
    uid = user.uid;
  } catch (e: any) {
    console.error('[AUTH_VERIFY_FAILURE]:', e.message);
    return NextResponse.json(
      { success: false, error: 'Authentication required', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  // 2. Validate
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body', code: 'INTERNAL_ERROR' },
      { status: 400 }
    );
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const userAgent = req.headers.get('user-agent') ?? '';

  const log = async (values: Partial<typeof downloadLogs.$inferInsert>) => {
    try {
      await getDb().insert(downloadLogs).values({
        userId: uid,
        productId: body.productId as any,
        orderId: body.orderId,
        ipAddress: ip,
        userAgent,
        success: false,
        ...values,
      });
    } catch { /* logging must never break the request */ }
  };

  // 3. Rate limits
  const rateLimit = await checkDownloadRateLimits({ userId: uid, ip, productId: body.productId });
  if (!rateLimit.allowed) {
    await log({ failureReason: 'rate_limit_exceeded' });
    return NextResponse.json(
      { success: false, error: rateLimit.reason ?? 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter ?? 3600) } }
    );
  }

  // 4. Eligibility — resolve product id then check entitlement row
  const db = getDb();
  let pid: any = body.productId;
  if (!/^[0-9a-f-]{36}$/i.test(body.productId)) {
    const [p] = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.firestoreId, body.productId)).limit(1);
    if (!p) {
      await log({ failureReason: 'not_eligible' });
      return NextResponse.json({ success: false, error: 'NOT_ELIGIBLE', code: 'NOT_ELIGIBLE' }, { status: 403 });
    }
    pid = p.id;
  }
  const [record] = await db
    .select()
    .from(downloadsTable)
    .where(and(eq(downloadsTable.userId, uid), eq(downloadsTable.productId, pid)))
    .limit(1);

  if (!record) {
    await log({ failureReason: 'not_eligible' });
    return NextResponse.json({ success: false, error: 'NOT_ELIGIBLE', code: 'NOT_ELIGIBLE' }, { status: 403 });
  }
  if (!record.isActive || !record.downloadAllowed) {
    await log({ failureReason: 'download_revoked' });
    return NextResponse.json({ success: false, error: 'DOWNLOAD_REVOKED', code: 'DOWNLOAD_REVOKED' }, { status: 403 });
  }
  if ((record.downloadCount ?? 0) >= (record.downloadLimit ?? 5)) {
    await log({ failureReason: 'download_limit_reached' });
    return NextResponse.json({ success: false, error: 'DOWNLOAD_LIMIT_REACHED', code: 'DOWNLOAD_LIMIT_REACHED' }, { status: 403 });
  }

  // 5. Signed R2 URL — fileKey is stored relative; tolerate legacy full URLs
  let signedUrl: string;
  let expiresAt: Date;
  try {
    const rawKey = record.fileKey || '';
    const cleanKey = rawKey.includes('https://')
      ? rawKey.split('/').slice(3).join('/')
      : rawKey;
    ({ url: signedUrl, expiresAt } = await generateSignedDownloadUrl(cleanKey, record.fileName || `${record.productSlug}.zip`));
  } catch (e: any) {
    console.error('[R2_SIGN_ERROR]:', e.message);
    await log({ failureReason: 'file_not_found' });
    return NextResponse.json(
      { success: false, error: 'File not available. Contact support.', code: 'FILE_NOT_FOUND' },
      { status: 404 }
    );
  }

  // 6. Increment count + log success
  try {
    await Promise.all([
      db
        .update(downloadsTable)
        .set({ downloadCount: sql`${downloadsTable.downloadCount} + 1`, lastDownloadedAt: new Date() })
        .where(and(eq(downloadsTable.userId, uid), eq(downloadsTable.productId, pid))),
      getDb().insert(downloadLogs).values({
        userId: uid,
        productId: pid,
        orderId: body.orderId,
        ipAddress: ip,
        userAgent,
        success: true,
        signedUrlExpiry: expiresAt,
      }),
    ]);
  } catch { /* non-fatal */ }

  return NextResponse.json({
    success: true,
    signedUrl,
    fileName: record.fileName ?? '',
    expiresAt: expiresAt.toISOString(),
    remainingDownloads: Math.max(0, (record.downloadLimit ?? 5) - (record.downloadCount ?? 0) - 1),
  });
}
