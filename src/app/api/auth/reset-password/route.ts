import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { passwordResetSessions, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { setFirebasePassword } from '@/lib/firebase-rest';

/**
 * Secure Password Reset Endpoint.
 * Verifies the OTP session in Neon, then updates the Firebase Auth password
 * via Google IdentityToolkit REST (service account OAuth — no firebase-admin).
 */
export async function POST(req: Request) {
  try {
    const { email, resetToken, newPassword } = await req.json();

    if (!email || !resetToken || !newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Incomplete or invalid request' }, { status: 400 });
    }

    const db = getDb();

    // 1. Validate Reset Session in Neon
    const [session] = await db
      .select()
      .from(passwordResetSessions)
      .where(
        and(
          eq(passwordResetSessions.email, email.toLowerCase()),
          eq(passwordResetSessions.token, resetToken),
          eq(passwordResetSessions.used, false)
        )
      )
      .limit(1);

    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired reset session' }, { status: 401 });
    }
    if (session.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Reset session has expired' }, { status: 401 });
    }

    // 2. Find user uid in Neon
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (!user) return NextResponse.json({ error: 'No account found' }, { status: 404 });

    // 3. Update Firebase Auth password via REST
    try {
      await setFirebasePassword(user.uid, newPassword);
    } catch (pwErr: any) {
      console.error('SERVER_PW_RESET_FAILURE:', pwErr.message);
      return NextResponse.json(
        { error: 'Failed to update password. Please try again or use the email reset link.' },
        { status: 500 }
      );
    }

    // 4. Invalidate Session
    await db.update(passwordResetSessions).set({ used: true }).where(eq(passwordResetSessions.id, session.id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('SERVER_PW_RESET_FAILURE:', error.message);
    return NextResponse.json({ error: 'Failed to update password. Please try again.' }, { status: 500 });
  }
}
