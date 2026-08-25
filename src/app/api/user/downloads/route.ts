import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { isDatabaseConfigured } from '@/lib/db';

/**
 * @fileOverview Secure User Library API
 * Fetches digital licenses and normalizes date formats for client-side parsing.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "") ?? "";

  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let uid: string;
  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(token);
    uid = decoded.uid;
  } catch (e: any) {
    return NextResponse.json({ success: false, error: 'Invalid Session' }, { status: 401 });
  }

  try {
    const { getUserDownloads } = isDatabaseConfigured()
      ? await import('@/lib/db/downloads')
      : await import('@/lib/firebase/downloads');
    const downloads = await getUserDownloads(uid);

    // Normalize and sanitize data for the client
    const safeDownloads = downloads
      .map((record: any) => {
        // Strip the private R2 file key from the client-facing response for security
        const { fileKey, ...rest } = record;
        
        // Ensure all Firestore Timestamps are serialized to ISO strings for hydration safety
        const formatTime = (ts: any) => {
          if (!ts) return null;
          if (ts.toDate) return ts.toDate().toISOString();
          if (ts instanceof Date) return ts.toISOString();
          return String(ts);
        };

        return {
          ...rest,
          purchasedAt: formatTime(record.purchasedAt),
          lastDownloadedAt: formatTime(record.lastDownloadedAt),
        };
      })
      .sort((a, b) => {
        // In-memory sort to ensure results are returned chronologically regardless of missing Firestore indexes
        const dateA = a.purchasedAt ? new Date(a.purchasedAt).getTime() : 0;
        const dateB = b.purchasedAt ? new Date(b.purchasedAt).getTime() : 0;
        return dateB - dateA;
      });

    console.log(`[USER_LIBRARY_SYNC]: Synced ${safeDownloads.length} assets for UID: ${uid}`);

    return NextResponse.json({ success: true, data: safeDownloads });
  } catch (e: any) {
    console.error('[FETCH_LIBRARY_ERROR]:', e.message);
    return NextResponse.json({ success: false, error: 'Vault Synchronization Error' }, { status: 500 });
  }
}
