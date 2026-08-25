import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { z } from 'zod';
import { checkDownloadRateLimits } from '@/lib/redis/downloadRateLimit';
import { generateSignedDownloadUrl } from '@/lib/r2/signedUrl';
import type { GenerateDownloadUrlResponse } from '@/types/download';
import { isDatabaseConfigured } from '@/lib/db';

const bodySchema = z.object({
  orderId: z.string().min(1).max(100),
  productId: z.string().min(1).max(100),
});

/**
 * @fileOverview Secure Digital Asset Download Terminal
 * Cleans the fileKey to ensure R2 compatibility and handles rate limiting.
 */
export async function POST(
  req: NextRequest
): Promise<NextResponse<GenerateDownloadUrlResponse>> {
  // 1. Verify Auth Token using Admin SDK
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "") ?? "";

  let uid: string;
  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(token);
    uid = decoded.uid;
  } catch (e: any) {
    console.error('[AUTH_VERIFY_FAILURE]:', e.message);
    return NextResponse.json(
      { success: false, error: 'Authentication required', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  // 2. Validate Body
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body', code: 'INTERNAL_ERROR' },
      { status: 400 }
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  // 3. Rate Limits (Redis)
  const rateLimit = await checkDownloadRateLimits({
    userId: uid, ip, productId: body.productId
  });

  if (!rateLimit.allowed) {
    const { logDownloadAttempt: logAttempt } = isDatabaseConfigured()
      ? await import('@/lib/db/downloads')
      : await import('@/lib/firebase/downloads');
    await logAttempt({
      userId: uid, productId: body.productId, orderId: body.orderId,
      ipAddress: ip, userAgent: req.headers.get("user-agent") ?? "",
      success: false, failureReason: "rate_limit_exceeded",
    } as any);
    return NextResponse.json(
      {
        success: false,
        error: rateLimit.reason ?? "Too many requests",
        code: 'RATE_LIMIT_EXCEEDED'
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfter ?? 3600) }
      }
    );
  }

  // 4. Eligibility Check — try SQL first, fallback Firestore
  let record;
  try {
    if (isDatabaseConfigured()) {
      const { checkDownloadEligibility } = await import('@/lib/db/downloads');
      record = await checkDownloadEligibility(uid, body.productId, body.orderId);
    } else {
      const { checkDownloadEligibility } = await import('@/lib/firebase/downloads');
      record = await checkDownloadEligibility(uid, body.productId, body.orderId);
    }
  } catch (err: any) {
    const code = err.message || "NOT_ELIGIBLE";
    const { logDownloadAttempt: logAttempt2 } = isDatabaseConfigured()
      ? await import('@/lib/db/downloads')
      : await import('@/lib/firebase/downloads');
    await logAttempt2({
      userId: uid, productId: body.productId, orderId: body.orderId,
      ipAddress: ip, userAgent: req.headers.get("user-agent") ?? "",
      success: false, failureReason: code.toLowerCase(),
    } as any);
    return NextResponse.json(
      { success: false, error: code, code: code as any },
      { status: 403 }
    );
  }

  // 5. Generate Signed R2 URL
  let signedUrl: string;
  let expiresAt: Date;
  try {
    // CRITICAL FIX: Extract relative key from full URL if necessary
    // Firestore might store "https://cdn.prontly.in/products/files/..."
    // R2 needs only "products/files/..."
    const cleanKey = record.fileKey.includes('https://') 
      ? record.fileKey.split('/').slice(3).join('/') 
      : record.fileKey;

    console.log(`[GENERATE_URL]: Attempting sign for key: ${cleanKey}`);
    
    ({ url: signedUrl, expiresAt } = await generateSignedDownloadUrl(cleanKey, record.fileName));
  } catch (e: any) {
    console.error('[R2_SIGN_ERROR]:', e.message);
    const { logDownloadAttempt: logAttempt3 } = isDatabaseConfigured()
      ? await import('@/lib/db/downloads')
      : await import('@/lib/firebase/downloads');
    await logAttempt3({
      userId: uid, productId: body.productId, orderId: body.orderId,
      ipAddress: ip, userAgent: req.headers.get("user-agent") ?? "",
      success: false, failureReason: "file_not_found",
    } as any);
    return NextResponse.json(
      { success: false, error: 'File not available. Contact support.', code: 'FILE_NOT_FOUND' },
      { status: 404 }
    );
  }

  // 6. Finalize: Increment Count & Log
  const { incrementDownloadCount, logDownloadAttempt: logAttempt4 } = isDatabaseConfigured()
    ? await import('@/lib/db/downloads')
    : await import('@/lib/firebase/downloads');
  await Promise.all([
    incrementDownloadCount(uid, body.productId),
    logAttempt4({
      userId: uid, productId: body.productId, orderId: body.orderId,
      ipAddress: ip, userAgent: req.headers.get("user-agent") ?? "",
      success: true, signedUrlExpiry: expiresAt as any,
    } as any),
  ]);

  return NextResponse.json({
    success: true,
    signedUrl,
    fileName: record.fileName,
    expiresAt: expiresAt.toISOString(),
    remainingDownloads: Math.max(0, record.downloadLimit - record.downloadCount - 1),
  });
}
