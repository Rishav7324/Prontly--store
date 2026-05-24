import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Resend } from 'resend';
import { generateOTP, hashOTP } from '@/lib/otp-utils';

const resend = new Resend(process.env.RESEND_API_KEY);
const SENDER = 'Prontly Store <reset-password@store.prontly.in>';

/**
 * @fileOverview Production-grade OTP Request Handler.
 * Generates and stores a hashed OTP in Firestore for password recovery.
 */
export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    // Robust validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is missing in environment variables.');
      return NextResponse.json({ error: 'Mail server configuration missing.' }, { status: 500 });
    }

    const auth = getAdminAuth();
    const db = getAdminDb();
    
    // 1. Check if user exists (Generic success to prevent enumeration)
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (e: any) {
      return NextResponse.json({ success: true, message: 'If an account exists, a code has been sent.' });
    }

    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // 2. Store OTP in Firestore using Admin SDK
    await db.collection('passwordResetOTP').add({
      email: email.toLowerCase(),
      otpHash,
      expiresAt: expiresAt,
      used: false,
      attempts: 0,
      createdAt: FieldValue.serverTimestamp(),
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown'
    });

    // 3. Dispatch Branded Email
    await resend.emails.send({
      from: SENDER,
      to: email,
      subject: `🔐 ${otp} is your Prontly Store reset code`,
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background-color: #f8fafc; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.05);">
    <div style="background-color: #1F4E79; padding: 40px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🚀 Prontly Store</h1>
    </div>
    <div style="padding: 48px; text-align: center;">
      <h2 style="color: #1e293b; margin-top: 0;">Verification Code</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${userRecord.displayName || 'Creator'}, use the code below to reset your account password. This code expires in 10 minutes.</p>
      
      <div style="margin: 32px 0;">
        <div style="display: inline-block; padding: 24px 48px; background-color: #f1f5f9; border: 2px solid #5b52d6; border-radius: 16px;">
          <span style="font-size: 42px; font-weight: 900; letter-spacing: 8px; color: #1F4E79;">${otp}</span>
        </div>
      </div>

      <p style="font-size: 12px; color: #94a3b8; margin-top: 32px;">
        If you didn't request this, your account is safe. Someone may have entered your email by mistake.
      </p>
    </div>
    <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
      © ${new Date().getFullYear()} Prontly Store | Secure Identity Protocol
    </div>
  </div>
</body>
</html>`
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('OTP_REQUEST_CRASH:', error.message);
    return NextResponse.json({ error: 'Server authentication failure. Please contact support.' }, { status: 500 });
  }
}
