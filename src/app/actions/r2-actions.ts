'use server';

import { PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2, R2_BUCKET_NAME } from '@/lib/r2';

/**
 * Robust server-side file upload to Cloudflare R2.
 */
export async function uploadFileAction(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const key = formData.get('key') as string;
    
    if (!file || !key) {
      return { success: false, error: 'File and key are required for upload.' };
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
    console.error('R2 Server Action Error:', error);
    return { success: false, error: 'Upload failed.' };
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
