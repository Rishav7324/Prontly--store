import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { isDatabaseConfigured, getDb } from '@/lib/db';
import { passwordResetSessions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Secure Password Reset Endpoint using Firebase Admin SDK.
 */
export async function POST(req: Request) {
  try {
    const { email, resetToken, newPassword } = await req.json();
    
    if (!email || !resetToken || !newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Incomplete or invalid request' }, { status: 400 });
    }

    const auth = getAdminAuth();

    if (isDatabaseConfigured()) {
      const db = getDb();
      const [row] = await db
        .select()
        .from(passwordResetSessions)
        .where(and(eq(passwordResetSessions.email, email.toLowerCase()), eq(passwordResetSessions.token, resetToken), eq(passwordResetSessions.used, false)))
        .limit(1);
      if (!row) return NextResponse.json({ error: 'Invalid or expired reset session' }, { status: 401 });
      if (row.expiresAt < new Date()) return NextResponse.json({ error: 'Reset session has expired' }, { status: 401 });
      const userRecord = await auth.getUserByEmail(email);
      await auth.updateUser(userRecord.uid, { password: newPassword });
      await db.update(passwordResetSessions).set({ used: true }).where(eq(passwordResetSessions.id, row.id));
      return NextResponse.json({ success: true });
    }

    const db = getAdminDb();
    const sessionSnap = await db.collection('passwordResetSessions')
      .where('email', '==', email.toLowerCase())
      .where('token', '==', resetToken)
      .where('used', '==', false)
      .limit(1)
      .get();
    if (sessionSnap.empty) return NextResponse.json({ error: 'Invalid or expired reset session' }, { status: 401 });
    const sessionDoc = sessionSnap.docs[0];
    const sessionData = sessionDoc.data();
    if (sessionData.expiresAt.toDate() < new Date()) return NextResponse.json({ error: 'Reset session has expired' }, { status: 401 });
    const userRecord = await auth.getUserByEmail(email);
    await auth.updateUser(userRecord.uid, { password: newPassword });
    await sessionDoc.ref.update({ used: true });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('SERVER_PW_RESET_FAILURE:', error.message);
    return NextResponse.json({ error: 'Failed to update password. Please try again.' }, { status: 500 });
  }
}
