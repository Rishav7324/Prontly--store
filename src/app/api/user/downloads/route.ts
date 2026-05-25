import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { getUserDownloads } from '@/lib/firebase/downloads';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "") ?? "";

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

    // IMPORTANT: Strip fileKey from response for security
    const safeDownloads = downloads.map(({ fileKey, ...rest }: any) => rest);

    return NextResponse.json({ success: true, data: safeDownloads });
  } catch (e: any) {
    console.error('[DB_FETCH_ERROR]:', e.message);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}
