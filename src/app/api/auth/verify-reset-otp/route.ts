
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, updateDoc, doc, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { hashOTP, generateResetToken } from '@/lib/otp-utils';

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();
    const { db } = initializeFirebase();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP required' }, { status: 400 });
    }

    // 1. Fetch latest active OTP for this email
    const otpQuery = query(
      collection(db, 'passwordResetOTP'),
      where('email', '==', email),
      where('used', '==', false),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(otpQuery);
    if (snapshot.empty) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    const otpDoc = snapshot.docs[0];
    const data = otpDoc.data();

    // 2. Security Checks
    if (data.attempts >= 5) {
      return NextResponse.json({ error: 'Too many attempts. Request a new code.' }, { status: 429 });
    }

    if (data.expiresAt.toDate() < new Date()) {
      return NextResponse.json({ error: 'Code has expired' }, { status: 400 });
    }

    if (data.otpHash !== hashOTP(otp)) {
      await updateDoc(otpDoc.ref, { attempts: data.attempts + 1 });
      return NextResponse.json({ error: 'Incorrect verification code' }, { status: 400 });
    }

    // 3. Mark Used & Create Session
    await updateDoc(otpDoc.ref, { used: true });

    const resetToken = generateResetToken();
    const sessionRef = await addDoc(collection(db, 'passwordResetSessions'), {
      email,
      token: resetToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
      used: false,
      createdAt: serverTimestamp()
    });

    return NextResponse.json({ success: true, resetToken });
  } catch (error: any) {
    console.error('OTP Verification Error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
