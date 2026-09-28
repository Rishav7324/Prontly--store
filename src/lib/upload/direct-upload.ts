import { getPresignedUploadUrlAction } from '@/app/actions/r2-actions';
import { convertToWebP } from '@/lib/image-optimizer';

export interface DirectUploadOptions {
  file: File;
  key: string;
  onProgress?: (percent: number) => void;
}

export interface DirectUploadResult {
  success: boolean;
  url?: string;
  key?: string;
  size?: number;
  error?: string;
  originalSize?: number;
  isWebPConverted?: boolean;
}

/**
 * Uploads any size file directly from browser to Cloudflare R2
 * using presigned PUT URLs with real-time upload progress tracking.
 * Automatically intercepts and converts all images to WebP before upload.
 */
export async function uploadFileDirectlyToR2({
  file,
  key,
  onProgress,
}: DirectUploadOptions): Promise<DirectUploadResult> {
  try {
    let uploadFile = file;
    let targetKey = key;
    let isWebPConverted = false;
    const originalSize = file.size;

    // Automatic WebP Conversion Pipeline for all images (excluding SVG vectors)
    if (
      typeof window !== 'undefined' &&
      file.type?.toLowerCase().startsWith('image/') &&
      !file.type.toLowerCase().includes('svg')
    ) {
      try {
        uploadFile = await convertToWebP(file);
        // Ensure destination key has .webp extension
        targetKey = targetKey.replace(/\.[^/.]+$/, '') + '.webp';
        isWebPConverted = true;
      } catch (webpErr) {
        console.warn('[R2_UPLOAD_WEBP_FALLBACK]: Could not convert image to WebP, uploading original:', webpErr);
      }
    }

    const contentType = uploadFile.type || 'application/octet-stream';

    // 1. Get presigned upload URL from server action
    const presignedRes = await getPresignedUploadUrlAction({
      key: targetKey,
      contentType,
    });

    if (!presignedRes.success || !presignedRes.presignedUrl || !presignedRes.publicUrl) {
      throw new Error(presignedRes.error || 'Failed to obtain secure upload token.');
    }

    // 2. Perform direct binary PUT request with XHR progress monitoring
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', presignedRes.presignedUrl!, true);
      xhr.setRequestHeader('Content-Type', contentType);

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          if (onProgress) onProgress(100);
          resolve();
        } else {
          reject(new Error(`Storage service responded with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network fault while streaming file to cloud storage.'));
      };

      xhr.ontimeout = () => {
        reject(new Error('Upload connection timed out.'));
      };

      xhr.send(uploadFile);
    });

    return {
      success: true,
      url: presignedRes.publicUrl,
      key: presignedRes.key,
      size: uploadFile.size,
      originalSize,
      isWebPConverted,
    };
  } catch (error: any) {
    console.error('[DIRECT_R2_UPLOAD_ERROR]:', error);
    return {
      success: false,
      error: error.message || 'Direct upload failed.',
    };
  }
}
