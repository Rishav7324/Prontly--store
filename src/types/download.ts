import { Timestamp } from 'firebase/firestore';

// ─── Download Record (stored in Firestore) ───────────────────────────────────
export interface DownloadRecord {
  id: string;                        // "{userId}_{productId}"
  userId: string;                    // Firebase Auth UID
  productId: string;                 // Firestore product document ID
  orderId: string;                   // Razorpay order ID
  productName: string;               // denormalized — for display
  productSlug: string;               // denormalized — for linking
  productImage: string;              // denormalized — thumbnail URL
  fileKey: string;                   // R2 private file key (NEVER expose to client)
  fileName: string;                  // display name e.g. "AI-Prompt-Pack-v2.pdf"
  fileSize: number;                  // bytes
  fileFormat: string;                // "pdf" | "zip" | "txt" | "psd" etc.
  fileVersion: string;               // e.g. "1.0"
  downloadLimit: number;             // max allowed downloads (default: 5)
  downloadCount: number;             // current download count
  purchasedAt: Timestamp;
  lastDownloadedAt: Timestamp | null;
  isActive: boolean;                 // false = revoked by admin
}

// ─── Download Log (each attempt logged here) ──────────────────────────────────
export interface DownloadLog {
  id: string;                        // auto-generated
  userId: string;
  productId: string;
  orderId: string;
  ipAddress: string;                 // for abuse detection
  userAgent: string;
  attemptedAt: Timestamp;
  success: boolean;                  // true = signed URL generated successfully
  failureReason?: string;            // "limit_exceeded" | "not_eligible" | "file_not_found"
  signedUrlExpiry?: Timestamp;       // when the signed URL will expire
}

// ─── API Response Types ────────────────────────────────────────────────────────
export interface GenerateDownloadUrlResponse {
  success: boolean;
  signedUrl?: string;                // 15-min Cloudflare R2 signed URL
  fileName?: string;
  expiresAt?: string;                // ISO string
  remainingDownloads?: number;
  error?: string;
  code?: DownloadErrorCode;
}

export type DownloadErrorCode =
  | 'UNAUTHORIZED'
  | 'ORDER_NOT_FOUND'
  | 'NOT_ELIGIBLE'
  | 'DOWNLOAD_LIMIT_REACHED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'FILE_NOT_FOUND'
  | 'DOWNLOAD_REVOKED'
  | 'INTERNAL_ERROR';

// ─── Frontend Download Item (for UI) ──────────────────────────────────────────
export interface DownloadItem {
  downloadRecord: DownloadRecord;
  isDownloading: boolean;
  downloadProgress: number;          // 0-100
  error: string | null;
  lastDownloadedAt: string | null;   // formatted date string
}