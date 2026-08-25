import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { generateOTP, hashOTP } from '@/lib/otp-utils';
import { sendEmail } from '@/services/email/service';
import { otpTemplate } from '@/services/email/templates';
import { isDatabaseConfigured, getDb } from '@/lib/db';
import { passwordResetOtps } from '@/lib/db/schema';

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

    const auth = getAdminAuth();
    const db = getAdminDb();
    
    // Check if user exists (Generic success response to prevent enumeration)
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (e: any) {
      console.log('Recovery attempt for non-existent user:', email);
      return NextResponse.json({ success: true, message: 'If an account exists, a code has been sent.' });
    }

    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minute window

    // Persist hashed OTP — SQL if configured, else Firestore
    if (isDatabaseConfigured()) {
      const dbSql = getDb();
      await dbSql.insert(passwordResetOtps).values({
        email: email.toLowerCase(),
        otpHash,
        expiresAt,
        used: false,
        attempts: 0,
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      });
    } else {
      await db.collection('passwordResetOTP').add({
        email: email.toLowerCase(),
        otpHash,
        expiresAt: expiresAt,
        used: false,
        attempts: 0,
        createdAt: FieldValue.serverTimestamp(),
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
      });
    }

    // Dispatch branded email using the 'security' sender channel
    // Sender: security@store.prontly.in
    await sendEmail({
      type: 'security',
      to: email,
      subject: `🔐 ${otp} is your Prontly verification code`,
      html: otpTemplate(otp, userRecord.displayName || 'Creator')
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('OTP_REQUEST_FAILURE:', error.message);
    return NextResponse.json({ error: 'System busy. Please try again later.' }, { status: 500 });
  }
}
