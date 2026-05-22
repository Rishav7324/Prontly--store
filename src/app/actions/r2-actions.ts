
'use server';

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2, R2_BUCKET_NAME } from '@/lib/r2';

/**
 * Generates a pre-signed URL for client-side uploads to Cloudflare R2.
 * @param key The file path/key in the bucket.
 * @param contentType The MIME type of the file.
 */
export async function getUploadUrl(key: string, contentType: string) {
  try {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(r2, command, { expiresIn: 3600 });
    return { url };
  } catch (error) {
    console.error('Failed to generate upload URL:', error);
    throw new Error('Could not generate upload URL');
  }
}
