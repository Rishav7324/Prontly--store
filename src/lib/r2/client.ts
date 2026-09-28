import { S3Client } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ACCOUNT_ID
    ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : 'https://missing-id.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || 'missing',
    secretAccessKey: R2_SECRET_ACCESS_KEY || 'missing',
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? 'prontly-store-files';
export const R2_PRIVATE_DIR = 'products/files/';
export const R2_IMAGES_DIR = 'products/images/';