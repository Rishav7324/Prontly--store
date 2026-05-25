import { GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_BUCKET } from './client';

const SIGNED_URL_EXPIRY_SECONDS = 15 * 60; // 15 minutes

/**
 * ─── Generate Signed Download URL ─────────────────────────────────────────────
 */
export async function generateSignedDownloadUrl(
  fileKey: string,
  fileName: string
): Promise<{ url: string; expiresAt: Date }> {
  // 1. Verify file exists in R2 before generating URL
  await r2Client.send(new HeadObjectCommand({
    Bucket: R2_BUCKET,
    Key: fileKey,
  }));

  // 2. Build GetObject command with Content-Disposition for clean download
  const command = new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: fileKey,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
  });

  // 3. Generate pre-signed URL (15 minutes)
  const url = await getSignedUrl(r2Client, command, {
    expiresIn: SIGNED_URL_EXPIRY_SECONDS,
  });

  const expiresAt = new Date(Date.now() + SIGNED_URL_EXPIRY_SECONDS * 1000);
  return { url, expiresAt };
}