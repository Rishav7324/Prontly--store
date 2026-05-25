import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { getUserDownloads } from '@/lib/firebase/downloads';

/**
 * @fileOverview Secure User Downloads API
 * Fetches perpetual licenses for the authenticated user and strips sensitive metadata.
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
    console.error('[FETCH_DOWNLOADS_UNAUTHORIZED]:', e.message);
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const downloads = await getUserDownloads(uid);

    // 1. Convert Timestamps to strings and handle potential nulls
    // 2. Strip private fileKey
    const safeDownloads = downloads
      .map((record: any) => {
        const { fileKey, ...rest } = record;
        
        // Helper to safely extract ISO string from Timestamp or Date
        const formatTime = (ts: any) => {
          if (!ts) return null;
          if (ts.toDate) return ts.toDate().toISOString();
          if (ts instanceof Date) return ts.toISOString();
          return ts; // Already a string or fallback
        };

        return {
          ...rest,
          purchasedAt: formatTime(record.purchasedAt),
          lastDownloadedAt: formatTime(record.lastDownloadedAt),
        };
      })
      // 3. Sort by purchasedAt descending (newest first) in-memory
      .sort((a, b) => {
        const dateA = a.purchasedAt ? new Date(a.purchasedAt).getTime() : 0;
        const dateB = b.purchasedAt ? new Date(b.purchasedAt).getTime() : 0;
        return dateB - dateA;
      });

    return NextResponse.json({ success: true, data: safeDownloads });
  } catch (e: any) {
    console.error('[DB_FETCH_ERROR]:', e.message);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}
