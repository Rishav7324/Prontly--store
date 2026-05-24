import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { generateOTP, hashOTP } from '@/lib/otp-utils';
import { sendEmail } from '@/services/email/service';
import { otpTemplate } from '@/services/email/templates';

/**
 * @fileOverview Secure OTP Request Handler.
 * Dispatches a branded code using the new Multi-Sender Security channel.
 */
export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const auth = getAdminAuth();
    const db = getAdminDb();
    
    // Check if user exists (Generic success to prevent enumeration)
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (e: any) {
      return NextResponse.json({ success: true, message: 'If an account exists, a code has been sent.' });
    }

    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Store OTP securely
    await db.collection('passwordResetOTP').add({
      email: email.toLowerCase(),
      otpHash,
      expiresAt: expiresAt,
      used: false,
      attempts: 0,
      createdAt: FieldValue.serverTimestamp(),
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown'
    });

    // Dispatch via Security Channel
    await sendEmail({
      type: 'security',
      to: email,
      subject: `🔐 ${otp} is your Prontly verification code`,
      html: otpTemplate(otp, userRecord.displayName || 'Creator')
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('OTP_REQUEST_FAILED:', error.message);
    return NextResponse.json({ error: 'System is currently busy. Please try again later.' }, { status: 500 });
  }
}
