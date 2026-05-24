
import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Resend } from 'resend';
import { generateOTP, hashOTP } from '@/lib/otp-utils';

const resend = new Resend(process.env.RESEND_API_KEY);
const SENDER = 'Prontly Store <reset-password@store.prontly.in>';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const { db } = initializeFirebase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    // 1. Check if user exists (Bypass Firebase standard to avoid templates)
    const auth = getAdminAuth();
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (e: any) {
      // Return generic success to prevent enumeration
      return NextResponse.json({ success: true, message: 'If an account exists, an OTP has been sent.' });
    }

    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // 2. Log in Firestore
    await addDoc(collection(db, 'passwordResetOTP'), {
      email,
      otpHash,
      expiresAt,
      used: false,
      attempts: 0,
      createdAt: serverTimestamp(),
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown'
    });

    // 3. Send Branded Email
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
    console.error('OTP Request Error:', error);
    return NextResponse.json({ error: 'System busy, try again later' }, { status: 500 });
  }
}
