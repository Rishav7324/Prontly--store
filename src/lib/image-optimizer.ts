/**
 * Client-side image optimization utility.
 * Converts to WebP and compresses before upload.
 */
export async function optimizeImage(file: File, maxWidth = 1200, quality = 0.8): Promise<{ blob: Blob; originalSize: number; optimizedSize: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if width is larger than maxWidth
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Could not get canvas context');
        
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                blob,
                originalSize: file.size,
                optimizedSize: blob.size
              });
            } else {
              reject('Optimization failed');
            }
          },
          'image/webp',
          quality
        );
      };
    };
    reader.onerror = (error) => reject(error);
  });
}
