import { S3Client } from '@aws-sdk/client-s3';

if (!process.env.R2_ACCOUNT_ID) throw new Error('R2_ACCOUNT_ID missing');
if (!process.env.R2_ACCESS_KEY_ID) throw new Error('R2_ACCESS_KEY_ID missing');
if (!process.env.R2_SECRET_ACCESS_KEY) throw new Error('R2_SECRET_ACCESS_KEY missing');

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? 'prontly-store-files';
export const R2_PRIVATE_DIR = 'products/files/';
export const R2_IMAGES_DIR = 'products/images/';