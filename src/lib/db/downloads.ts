/**
 * @fileOverview Downloads — SQL replacement for src/lib/firebase/downloads.ts
 * Same API surface so frontend needs minimal change.
 */

import { getDb } from '@/lib/db';
import { downloads, downloadLogs, products } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { DownloadRecord, DownloadLog } from '@/types/download';

export async function createDownloadRecord(
  userId: string,
  productId: string,
  orderId: string,
  productData: {
    name: string;
    slug: string;
    image: string;
    fileKey: string;
    fileName: string;
    fileSize: number;
    fileFormat: string;
    fileVersion: string;
  },
  downloadLimit = 5
): Promise<void> {
  const db = getDb();
  await db
    .insert(downloads)
    .values({
      userId,
      productId,
      orderId,
      productName: productData.name,
      productSlug: productData.slug,
      productImage: productData.image,
      fileKey: productData.fileKey,
      fileName: productData.fileName,
      fileSize: productData.fileSize,
      fileFormat: productData.fileFormat,
      fileVersion: productData.fileVersion,
      downloadLimit,
      downloadCount: 0,
      isActive: true,
      downloadAllowed: true,
    })
    .onConflictDoUpdate({
      target: [downloads.userId, downloads.productId],
      set: {
        orderId,
        fileKey: productData.fileKey,
        isActive: true,
        downloadAllowed: true,
      },
    });
}

export async function getUserDownloads(userId: string): Promise<any[]> {
  const db = getDb();
  const rows = await db.select().from(downloads).where(eq(downloads.userId, userId));
  // Normalize to Firestore-like shape for existing frontend
  return rows.map((r) => ({
    id: r.productId,
    userId: r.userId,
    productId: r.productId,
    orderId: r.orderId,
    productName: r.productName,
    productSlug: r.productSlug,
    productImage: r.productImage,
    fileKey: r.fileKey,
    fileName: r.fileName,
    fileSize: r.fileSize,
    fileFormat: r.fileFormat,
    fileVersion: r.fileVersion,
    downloadLimit: r.downloadLimit,
    downloadCount: r.downloadCount,
    purchasedAt: r.purchasedAt,
    lastDownloadedAt: r.lastDownloadedAt,
    isActive: r.isActive,
    downloadAllowed: r.downloadAllowed,
  }));
}

export async function checkDownloadEligibility(
  userId: string,
  productId: string,
  orderId: string
): Promise<any> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(downloads)
    .where(and(eq(downloads.userId, userId), eq(downloads.productId, productId)))
    .limit(1);

  if (!row) throw new Error('NOT_ELIGIBLE');
  if (!row.isActive || !row.downloadAllowed) throw new Error('DOWNLOAD_REVOKED');
  if ((row.downloadCount ?? 0) >= (row.downloadLimit ?? 5)) throw new Error('DOWNLOAD_LIMIT_REACHED');

  return {
    id: row.productId,
    userId: row.userId,
    productId: row.productId,
    orderId: row.orderId,
    productName: row.productName,
    productSlug: row.productSlug,
    productImage: row.productImage,
    fileKey: row.fileKey,
    fileName: row.fileName,
    fileSize: row.fileSize,
    fileFormat: row.fileFormat,
    fileVersion: row.fileVersion,
    downloadLimit: row.downloadLimit,
    downloadCount: row.downloadCount,
    purchasedAt: row.purchasedAt,
    lastDownloadedAt: row.lastDownloadedAt,
    isActive: row.isActive,
  };
}

export async function incrementDownloadCount(userId: string, productId: string): Promise<void> {
  const db = getDb();
  await db
    .update(downloads)
    .set({
      downloadCount: sql`${downloads.downloadCount} + 1`,
      lastDownloadedAt: new Date(),
    } as any)
    .where(and(eq(downloads.userId, userId), eq(downloads.productId, productId)));
}

export async function logDownloadAttempt(log: Omit<DownloadLog, 'id'>): Promise<void> {
  const db = getDb();
  await db.insert(downloadLogs).values({
    userId: log.userId,
    productId: log.productId as any,
    orderId: log.orderId,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    success: log.success,
    failureReason: (log as any).failureReason || null,
    signedUrlExpiry: (log as any).signedUrlExpiry ? new Date((log as any).signedUrlExpiry) : null,
  });
}
