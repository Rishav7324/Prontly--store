import { NextResponse } from 'next/server';
import { hashOTP, generateResetToken } from '@/lib/otp-utils';
import { getDb } from '@/lib/db';
import { passwordResetOtps, passwordResetSessions } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

/**
 * Verifies OTP and generates a temporary reset session.
 */
export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();
    
    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP required' }, { status: 400 });
    }

    if (isDatabaseConfigured()) {
      const db = getDb();
      const [row] = await db
        .select()
        .from(passwordResetOtps)
        .where(and(eq(passwordResetOtps.email, email.toLowerCase()), eq(passwordResetOtps.used, false)))
        .orderBy(desc(passwordResetOtps.createdAt))
        .limit(1);
      if (!row) return NextResponse.json({ error: 'No active verification code found' }, { status: 400 });
      if ((row.attempts ?? 0) >= 5) return NextResponse.json({ error: 'Too many attempts. Please request a new code.' }, { status: 429 });
      if (row.expiresAt < new Date()) return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
      if (row.otpHash !== hashOTP(otp)) {
        await db.update(passwordResetOtps).set({ attempts: (row.attempts ?? 0) + 1 }).where(eq(passwordResetOtps.id, row.id));
        return NextResponse.json({ error: 'Incorrect verification code' }, { status: 400 });
      }
      await db.update(passwordResetOtps).set({ used: true }).where(eq(passwordResetOtps.id, row.id));
      const resetToken = generateResetToken();
      await db.insert(passwordResetSessions).values({
        email: email.toLowerCase(),
        token: resetToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        used: false,
      });
      return NextResponse.json({ success: true, resetToken });
    }

  } catch (error: any) {
    console.error('SERVER_OTP_VERIFY_FAILURE:', error.message);
    return NextResponse.json({ error: 'System error during verification' }, { status: 500 });
  }
}