import { NextResponse } from 'next/server';
import { generateOTP, hashOTP } from '@/lib/otp-utils';
import { sendEmail } from '@/services/email/service';
import { otpTemplate } from '@/services/email/templates';
import { getDb } from '@/lib/db';
import { passwordResetOtps, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Secure OTP Request Handler.
 * Generates a single-use hashed code and dispatches a branded email via the Security channel.
 */
export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // 1. Check for recent OTP request (60 second cooldown)
    const recent = await getDb()
      .select()
      .from(passwordResetOtps)
      .where(eq(passwordResetOtps.email, email.toLowerCase()))
      .orderBy(desc(passwordResetOtps.createdAt))
      .limit(1);

    if (recent.length > 0 && recent[0].createdAt) {
      const timeSinceLast = Date.now() - new Date(recent[0].createdAt).getTime();
      if (timeSinceLast < 60 * 1000) {
        return NextResponse.json(
          { error: 'Please wait 60 seconds before requesting another verification code.' },
          { status: 429 }
        );
      }
    }

    // User existence check via Neon (no Firebase Admin needed)
    const existing = await getDb().select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    if (existing.length === 0) {
      console.log('Recovery attempt for non-existent user:', email);
      return NextResponse.json({ success: true, message: 'If an account exists, a code has been sent.' });
    }
    const displayName = existing[0].displayName || 'Creator';

    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minute window

    await getDb().insert(passwordResetOtps).values({
      email: email.toLowerCase(),
      otpHash,
      expiresAt,
      used: false,
      attempts: 0,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    });

    // Dispatch branded email using the 'security' sender channel
    // Sender: security@store.prontly.in
    await sendEmail({
      type: 'security',
      to: email,
      subject: `🔐 ${otp} is your Prontly verification code`,
      html: otpTemplate(otp, displayName)
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('OTP_REQUEST_FAILURE:', error.message);
    return NextResponse.json({ error: 'System busy. Please try again later.' }, { status: 500 });
  }
}
