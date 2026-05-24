
import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { Resend } from 'resend';

/**
 * @fileOverview Branded Password Reset API Endpoint.
 * Generates a Firebase OOB code and sends a premium HTML email via Resend.
 * Uses the specific security sender address.
 */

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = 'Prontly Store <reset-password@store.prontly.in>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // 1. Validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is missing on server.');
    }

    const auth = getAdminAuth();

    // 2. Check user existence (Security: generic response on not-found to prevent enumeration)
    let user;
    try {
      user = await auth.getUserByEmail(email);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        return NextResponse.json({ success: true, message: 'Recovery link dispatched if account exists.' });
      }
      throw e;
    }

    // 3. Generate secure reset link via Admin SDK
    const firebaseLink = await auth.generatePasswordResetLink(email, {
      url: `${SITE_URL}/login`,
    });

    // 4. Extract code for custom branded URL
    const urlObj = new URL(firebaseLink);
    const oobCode = urlObj.searchParams.get('oobCode');
    const brandedLink = `${SITE_URL}/reset-password?oobCode=${oobCode}`;

    // 5. Send Branded Email
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
    <div style="background-color: #f1f5f9; padding: 24px; text-align: center; color: #64748b; font-size: 11px;">
      <p>© ${new Date().getFullYear()} Prontly Store | Premium Digital Assets</p>
    </div>
  </div>
</body>
</html>`
    });

    if (resendError) {
      console.error('Resend Error:', resendError);
      return NextResponse.json({ error: `Mail delivery failed: ${resendError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Password Reset API Error:', error);
    return NextResponse.json({ 
      error: 'An internal error occurred.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 });
  }
}
