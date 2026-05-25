import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { z } from 'zod';
import { checkDownloadEligibility, incrementDownloadCount, logDownloadAttempt } from '@/lib/firebase/downloads';
import { checkDownloadRateLimits } from '@/lib/redis/downloadRateLimit';
import { generateSignedDownloadUrl } from '@/lib/r2/signedUrl';
import type { GenerateDownloadUrlResponse } from '@/types/download';

const bodySchema = z.object({
  orderId: z.string().min(1).max(100),
  productId: z.string().min(1).max(100),
});

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
    await logDownloadAttempt({
      userId: uid, productId: body.productId, orderId: body.orderId,
      ipAddress: ip, userAgent: req.headers.get("user-agent") ?? "",
      success: false, failureReason: "rate_limit_exceeded",
    });
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

  // 4. Eligibility Check
  let record;
  try {
    record = await checkDownloadEligibility(uid, body.productId, body.orderId);
  } catch (err: any) {
    const code = err.message || "NOT_ELIGIBLE";
    await logDownloadAttempt({
      userId: uid, productId: body.productId, orderId: body.orderId,
      ipAddress: ip, userAgent: req.headers.get("user-agent") ?? "",
      success: false, failureReason: code.toLowerCase(),
    });
    return NextResponse.json(
      { success: false, error: code, code: code as any },
      { status: 403 }
    );
  }

  // 5. Generate Signed R2 URL
  let signedUrl: string;
  let expiresAt: Date;
  try {
    ({ url: signedUrl, expiresAt } = await generateSignedDownloadUrl(record.fileKey, record.fileName));
  } catch (e: any) {
    console.error('[R2_SIGN_ERROR]:', e.message);
    await logDownloadAttempt({
      userId: uid, productId: body.productId, orderId: body.orderId,
      ipAddress: ip, userAgent: req.headers.get("user-agent") ?? "",
      success: false, failureReason: "file_not_found",
    });
    return NextResponse.json(
      { success: false, error: 'File not available. Contact support.', code: 'FILE_NOT_FOUND' },
      { status: 404 }
    );
  }

  // 6. Finalize: Increment Count & Log
  await Promise.all([
    incrementDownloadCount(uid, body.productId),
    logDownloadAttempt({
      userId: uid, productId: body.productId, orderId: body.orderId,
      ipAddress: ip, userAgent: req.headers.get("user-agent") ?? "",
      success: true, signedUrlExpiry: expiresAt as any,
    }),
  ]);

  return NextResponse.json({
    success: true,
    signedUrl,
    fileName: record.fileName,
    expiresAt: expiresAt.toISOString(),
    remainingDownloads: Math.max(0, record.downloadLimit - record.downloadCount - 1),
  });
}
