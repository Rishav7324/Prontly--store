'use server';

import { PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2, R2_BUCKET_NAME } from '@/lib/r2';
import { getAdminDb } from '@/lib/firebase-admin';

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
 * Generates a pre-signed URL for downloading a private file from R2.
 * Includes security verification to ensure the user has purchased the asset.
 */
export async function getDownloadUrl(productId: string, userId: string) {
  console.log(`[SECURE_DOWNLOAD_REQUEST]: Product: ${productId} | User: ${userId}`);
  
  try {
    const db = getAdminDb();
    
    // 1. Verify User Ownership via Orders
    // We check for 'paid' or 'delivered' status
    let ordersSnap;
    try {
      ordersSnap = await db.collection('orders')
        .where('userId', '==', userId)
        .get();
    } catch (dbErr: any) {
      console.error('[SECURE_DOWNLOAD_DB_FETCH_ERROR]:', dbErr.message);
      
      // Handle the specific 'Missing Index' error
      if (dbErr.message.includes('FAILED_PRECONDITION')) {
        throw new Error('Database indexing in progress. Please check server logs for the creation link.');
      }
      
      throw new Error('Could not retrieve order history for verification.');
    }

    const hasPurchased = ordersSnap.docs.some(doc => {
      const data = doc.data();
      const items = data.items || [];
      // Only count if status is paid or delivered
      if (!['paid', 'delivered'].includes(data.status)) return false;
      return items.some((item: any) => item.productId === productId);
    });

    if (!hasPurchased) {
      console.warn(`[SECURE_DOWNLOAD_DENIED]: No valid order for user ${userId} and product ${productId}`);
      throw new Error('Access Denied: You must purchase this product to access the source files.');
    }

    // 2. Fetch File Key
    const productSnap = await db.collection('products').doc(productId).get();
    if (!productSnap.exists) throw new Error('Product metadata not found in database.');
    
    const product = productSnap.data();
    const key = product?.fileKey;

    if (!key) {
      console.error(`[SECURE_DOWNLOAD_ERROR]: Product ${productId} has no fileKey.`);
      throw new Error('Source file not available for this product yet.');
    }

    // 3. Generate Signed URL
    // Extract key if it's a full URL
    const cleanKey = key.includes('https://') 
      ? key.split('/').slice(3).join('/') 
      : key;

    console.log(`[SECURE_DOWNLOAD_SUCCESS]: Generating signed link for R2 Key: ${cleanKey}`);

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: cleanKey,
    });

    // Valid for 10 minutes
    const url = await getSignedUrl(r2, command, { expiresIn: 600 });
    
    return { url };
  } catch (error: any) {
    console.error('[SECURE_DOWNLOAD_EXCEPTION]:', error.message);
    throw new Error(error.message || 'Verification process failed.');
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
