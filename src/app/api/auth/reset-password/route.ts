import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

/**
 * Secure Password Reset Endpoint using Firebase Admin SDK.
 */
export async function POST(req: Request) {
  try {
    const { email, resetToken, newPassword } = await req.json();
    
    if (!email || !resetToken || !newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Incomplete or invalid request' }, { status: 400 });
    }

    const db = getAdminDb();
    const auth = getAdminAuth();

    // 1. Validate Reset Session in Firestore using Admin SDK
    const sessionSnap = await db.collection('passwordResetSessions')
      .where('email', '==', email.toLowerCase())
      .where('token', '==', resetToken)
      .where('used', '==', false)
      .limit(1)
      .get();

    if (sessionSnap.empty) {
      return NextResponse.json({ error: 'Invalid or expired reset session' }, { status: 401 });
    }

    const sessionDoc = sessionSnap.docs[0];
    const sessionData = sessionDoc.data();

    // Check expiry
    if (sessionData.expiresAt.toDate() < new Date()) {
      return NextResponse.json({ error: 'Reset session has expired' }, { status: 401 });
    }

    // 2. Perform Password Update via Admin Auth
    const userRecord = await auth.getUserByEmail(email);
    await auth.updateUser(userRecord.uid, {
      password: newPassword
    });

    // 3. Invalidate Session
    await sessionDoc.ref.update({ used: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('SERVER_PW_RESET_FAILURE:', error.message);
    return NextResponse.json({ error: 'Failed to update password. Please try again.' }, { status: 500 });
  }
}
