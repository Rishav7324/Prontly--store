/**
 * Client-side image optimization and WebP conversion utility.
 * Guarantees all uploaded images are converted to WebP with smart compression.
 */

export interface OptimizedImageResult {
  blob: Blob;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
}

/**
 * Optimizes an image using HTML5 Canvas and exports as image/webp.
 */
export async function optimizeImage(
  file: File,
  maxWidth = 1600,
  quality = 0.85
): Promise<OptimizedImageResult> {
  return new Promise((resolve, reject) => {
    // If not a browser environment or not an image
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return reject(new Error('optimizeImage must run in a browser context'));
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Maintain aspect ratio while bounding by maxWidth
      if (width > maxWidth) {
        height = Math.round((maxWidth / width) * height);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not create canvas 2D rendering context'));
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              blob,
              originalSize: file.size,
              optimizedSize: blob.size,
              width,
              height,
            });
          } else {
            reject(new Error('WebP canvas compression failed'));
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err instanceof Error ? err : new Error('Failed to load image file into memory'));
    };

    img.src = objectUrl;
  });
}

/**
 * Converts ANY image File into a WebP File instance before uploading.
 * Non-image files and SVG vectors pass through unchanged.
 */
export async function convertToWebP(
  file: File,
  maxWidth = 1600,
  quality = 0.85
): Promise<File> {
  const mime = file.type?.toLowerCase() || '';

  // Non-images and SVG vectors are preserved as-is
  if (!mime.startsWith('image/') || mime.includes('svg')) {
    return file;
  }

  // If already WebP and already lightweight (< 350KB), no re-compression needed
  if (mime === 'image/webp' && file.size < 350 * 1024) {
    return file;
  }

  const { blob } = await optimizeImage(file, maxWidth, quality);
  const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  const webpFileName = `${baseName}.webp`;

  return new File([blob], webpFileName, {
    type: 'image/webp',
    lastModified: Date.now(),
  });
}
