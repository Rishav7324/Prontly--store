import { getPresignedUploadUrlAction } from '@/app/actions/r2-actions';

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
}

/**
 * Uploads any size file (1KB to 5GB+) directly from browser to Cloudflare R2
 * using presigned PUT URLs with real-time upload progress tracking.
 */
export async function uploadFileDirectlyToR2({
  file,
  key,
  onProgress,
}: DirectUploadOptions): Promise<DirectUploadResult> {
  try {
    // 1. Get presigned upload URL from server action (instant ~50ms)
    const presignedRes = await getPresignedUploadUrlAction({
      key,
      contentType: file.type || 'application/octet-stream',
    });

    if (!presignedRes.success || !presignedRes.presignedUrl || !presignedRes.publicUrl) {
      throw new Error(presignedRes.error || 'Failed to obtain secure upload token.');
    }

    // 2. Perform direct binary PUT request with XHR progress monitoring
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', presignedRes.presignedUrl!, true);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

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

      xhr.send(file);
    });

    return {
      success: true,
      url: presignedRes.publicUrl,
      key: presignedRes.key,
      size: file.size,
    };
  } catch (error: any) {
    console.error('[DIRECT_R2_UPLOAD_ERROR]:', error);
    return {
      success: false,
      error: error.message || 'Direct upload failed.',
    };
  }
}
