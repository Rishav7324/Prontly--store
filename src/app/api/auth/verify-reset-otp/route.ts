import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { hashOTP, generateResetToken } from '@/lib/otp-utils';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Verifies OTP and generates a temporary reset session.
 */
export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();
    
    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP required' }, { status: 400 });
    }

    const db = getAdminDb();
    
    // 1. Fetch latest active OTP for this email
    const otpSnap = await db.collection('passwordResetOTP')
      .where('email', '==', email.toLowerCase())
      .where('used', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (otpSnap.empty) {
      return NextResponse.json({ error: 'No active verification code found' }, { status: 400 });
    }

    const otpDoc = otpSnap.docs[0];
    const data = otpDoc.data();

    // 2. Security Checks
    if (data.attempts >= 5) {
      return NextResponse.json({ error: 'Too many attempts. Please request a new code.' }, { status: 429 });
    }

    if (data.expiresAt.toDate() < new Date()) {
      return NextResponse.json({ error: 'Verification code has expired' }, { status: 400 });
    }

    if (data.otpHash !== hashOTP(otp)) {
      await otpDoc.ref.update({ attempts: FieldValue.increment(1) });
      return NextResponse.json({ error: 'Incorrect verification code' }, { status: 400 });
    }

    // 3. Mark OTP as used
    await otpDoc.ref.update({ used: true });

    // 4. Create secure temporary reset session
    const resetToken = generateResetToken();
    await db.collection('passwordResetSessions').add({
      email: email.toLowerCase(),
      token: resetToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minute validity
      used: false,
      createdAt: FieldValue.serverTimestamp()
    });

    return NextResponse.json({ success: true, resetToken });
  } catch (error: any) {
    console.error('SERVER_OTP_VERIFY_FAILURE:', error.message);
    return NextResponse.json({ error: 'System error during verification' }, { status: 500 });
  }
}
