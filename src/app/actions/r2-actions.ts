'use server';

import { PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2, R2_BUCKET_NAME } from '@/lib/r2';

/**
 * Robust server-side file upload to Cloudflare R2.
 * Bypasses CORS issues common with client-side signed URL uploads.
 */
export async function uploadFileAction(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const key = formData.get('key') as string;
    
    if (!file || !key) {
      throw new Error('File and key are required');
    }

    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID) {
      throw new Error('Storage credentials (R2) are not configured in environment variables.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await r2.send(command);

    return { 
      success: true, 
      url: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://cdn.prontly.in'}/${key}` 
    };
  } catch (error: any) {
    console.error('Failed to upload to R2:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to sync with storage provider' 
    };
  }
}

/**
 * Generates a pre-signed URL for client-side uploads to Cloudflare R2.
 * @deprecated Use uploadFileAction for better reliability unless handling very large files (>10MB).
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

/**
 * Generates a pre-signed URL for downloading a private file from R2.
 * Valid for 10 minutes.
 */
export async function getDownloadUrl(key: string) {
  try {
    const cleanKey = key.includes('https://') 
      ? key.split('/').slice(3).join('/') 
      : key;

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: cleanKey,
    });

    const url = await getSignedUrl(r2, command, { expiresIn: 600 });
    return { url };
  } catch (error) {
    console.error('Failed to generate download URL:', error);
    throw new Error('Could not generate download URL');
  }
}

/**
 * Lists objects in the R2 bucket.
 */
export async function listStorageFiles(prefix: string = '') {
  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
    });

    const response = await r2.send(command);
    return response.Contents?.map(file => ({
      key: file.Key,
      size: file.Size,
      lastModified: file.LastModified,
      url: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://cdn.prontly.in'}/${file.Key}`
    })) || [];
  } catch (error) {
    console.error('Failed to list files:', error);
    return [];
  }
}

/**
 * Deletes an object from the R2 bucket.
 */
export async function deleteStorageFile(key: string) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    await r2.send(command);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete file:', error);
    throw new Error('Could not delete file');
  }
}
