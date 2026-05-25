import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { DownloadRecord, DownloadLog } from '@/types/download';

/**
 * ─── Create Download Record After Purchase ────────────────────────────────────
 * Call this from Razorpay webhook handler after payment.captured event
 */
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
  const db = getAdminDb();
  const docRef = db
    .collection("downloads")
    .doc(userId)
    .collection("products")
    .doc(productId);

  const record: Omit<DownloadRecord, "id"> = {
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
    purchasedAt: Timestamp.now(),
    lastDownloadedAt: null,
    isActive: true,
  };

  await docRef.set(record, { merge: false });
}

/**
 * ─── Get All Downloads For A User ─────────────────────────────────────────────
 */
export async function getUserDownloads(
  userId: string
): Promise<DownloadRecord[]> {
  const db = getAdminDb();
  const snap = await db
    .collection("downloads")
    .doc(userId)
    .collection("products")
    .orderBy("purchasedAt", "desc")
    .get();

  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DownloadRecord));
}

/**
 * ─── Check Download Eligibility ───────────────────────────────────────────────
 */
export async function checkDownloadEligibility(
  userId: string,
  productId: string,
  orderId: string
): Promise<DownloadRecord> {
  const db = getAdminDb();
  const doc = await db
    .collection("downloads")
    .doc(userId)
    .collection("products")
    .doc(productId)
    .get();

  if (!doc.exists) throw new Error('NOT_ELIGIBLE');

  const record = { id: doc.id, ...doc.data() } as DownloadRecord;

  if (!record.isActive) throw new Error('DOWNLOAD_REVOKED');
  if (record.orderId !== orderId) throw new Error('NOT_ELIGIBLE');
  if (record.downloadCount >= record.downloadLimit) {
    throw new Error('DOWNLOAD_LIMIT_REACHED');
  }

  return record;
}

/**
 * ─── Increment Download Count ─────────────────────────────────────────────────
 */
export async function incrementDownloadCount(
  userId: string,
  productId: string
): Promise<void> {
  const db = getAdminDb();
  await db
    .collection("downloads")
    .doc(userId)
    .collection("products")
    .doc(productId)
    .update({
      downloadCount: FieldValue.increment(1),
      lastDownloadedAt: Timestamp.now(),
    });
}

/**
 * ─── Log Download Attempt ─────────────────────────────────────────────────────
 */
export async function logDownloadAttempt(
  log: Omit<DownloadLog, "id">
): Promise<void> {
  const db = getAdminDb();
  await db.collection("download_logs").add({
    ...log,
    attemptedAt: Timestamp.now(),
  });
}

/**
 * ─── Admin: Revoke Download Access ────────────────────────────────────────────
 */
export async function revokeDownloadAccess(
  userId: string,
  productId: string
): Promise<void> {
  const db = getAdminDb();
  await db
    .collection("downloads")
    .doc(userId)
    .collection("products")
    .doc(productId)
    .update({ isActive: false });
}

/**
 * ─── Admin: Get Download Logs For A Product ───────────────────────────────────
 */
export async function getProductDownloadLogs(
  productId: string,
  limitCount = 50
): Promise<DownloadLog[]> {
  const db = getAdminDb();
  const snap = await db
    .collection("download_logs")
    .where("productId", "==", productId)
    .orderBy("attemptedAt", "desc")
    .limit(limitCount)
    .get();

  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DownloadLog));
}