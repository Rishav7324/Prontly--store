import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { Resend } from 'resend';

/**
 * @fileOverview Branded Password Reset API Endpoint.
 * Uses the specific security sender address.
 */

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = 'Prontly Store <reset-password@store.prontly.in>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    const auth = getAdminAuth();

    let user;
    try {
      user = await auth.getUserByEmail(email);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        return NextResponse.json({ success: true, message: 'Recovery link dispatched if account exists.' });
      }
      throw e;
    }

    const firebaseLink = await auth.generatePasswordResetLink(email, {
      url: `${SITE_URL}/login`,
    });

    const urlObj = new URL(firebaseLink);
    const oobCode = urlObj.searchParams.get('oobCode');
    const brandedLink = `${SITE_URL}/reset-password?oobCode=${oobCode}`;

    const { error: resendError } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: '🔐 Secure Password Reset — Prontly Store',
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background-color: #f8fafc; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.05);">
    <div style="background-color: #1F4E79; padding: 40px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🚀 Prontly Store</h1>
    </div>
    <div style="padding: 48px; text-align: center;">
      <h2 style="color: #1e293b; margin-top: 0;">Account Recovery</h2>
      <p style="color: #475569; line-height: 1.6;">Hi ${user.displayName || 'Creator'}, click the button below to secure your account and set a new password.</p>
      <a href="${brandedLink}" style="display: inline-block; padding: 16px 40px; background-color: #5b52d6; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: bold; margin: 32px 0;">Reset My Password</a>
      <p style="font-size: 12px; color: #94a3b8;">This link will expire in 15 minutes. If you didn't request this, ignore this email.</p>
    </div>
  </div>
</body>
</html>`
    });

    if (resendError) {
      throw new Error(`Resend failed: ${resendError.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Password Reset API Error:', error);
    return NextResponse.json({ 
      error: 'Branded delivery failed, please use standard recovery.',
      details: error.message 
    }, { status: 500 });
  }
}
