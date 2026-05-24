import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { Resend } from 'resend';

/**
 * @fileOverview Secure Password Reset API Endpoint.
 * Generates a Firebase OOB code and sends a custom branded email via Resend.
 */

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = 'Prontly Store <noreply@store.prontly.in>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // 1. Validation
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    const auth = getAdminAuth();

    // 2. Security: Check if user exists (Optional, but usually we proceed blindly to prevent enumeration)
    let user;
    try {
      user = await auth.getUserByEmail(email);
    } catch (e: any) {
      // If user not found, we return a generic success to prevent email discovery attacks
      if (e.code === 'auth/user-not-found') {
        return NextResponse.json({ success: true, message: 'Recovery email dispatched if account exists.' });
      }
      throw e;
    }

    // 3. Generate secure reset link via Admin SDK
    // This link contains the oobCode we need
    const firebaseLink = await auth.generatePasswordResetLink(email, {
      url: `${SITE_URL}/login`,
    });

    // 4. Extract the oobCode to build our own branded URL
    const urlObj = new URL(firebaseLink);
    const oobCode = urlObj.searchParams.get('oobCode');
    const brandedResetLink = `${SITE_URL}/reset-password?oobCode=${oobCode}`;

    // 5. Dispatch Branded Email via Resend
    const name = user.displayName || 'Creator';
    
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: '🔐 Secure Password Reset Request — Prontly Store',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.05); }
    .header { background-color: #1F4E79; padding: 40px; text-align: center; }
    .content { padding: 48px; text-align: center; }
    .footer { background-color: #f1f5f9; padding: 24px; text-align: center; color: #64748b; font-size: 12px; }
    .button { display: inline-block; padding: 16px 40px; background-color: #5b52d6; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: bold; margin: 32px 0; box-shadow: 0 10px 20px rgba(91, 82, 214, 0.2); }
    h1 { color: #ffffff; margin: 0; font-size: 24px; letter-spacing: -0.5px; }
    p { color: #475569; line-height: 1.6; margin-bottom: 16px; }
    .security-notice { background-color: #fff7ed; border-left: 4px solid #f97316; padding: 16px; margin: 24px 0; text-align: left; font-size: 13px; color: #9a3412; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚀 Prontly Store</h1>
    </div>
    <div class="content">
      <h2 style="color: #1e293b; margin-top: 0;">Password Reset</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset the password for your Prontly Store account. To proceed, please click the button below:</p>
      
      <a href="${brandedResetLink}" class="button">Reset My Password</a>
      
      <p style="font-size: 14px; color: #94a3b8;">This link will expire in 15 minutes. If you did not request this, you can safely ignore this email.</p>
      
      <div class="security-notice">
        <strong>Security Tip:</strong> Always ensure you are on <strong>store.prontly.in</strong> before entering your credentials. Prontly will never ask for your password over email.
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Prontly Store | Premium Digital Assets</p>
      <p>Patna, Bihar, India | support@prontly.in</p>
    </div>
  </div>
</body>
</html>`
    });

    return NextResponse.json({ success: true, message: 'Recovery email sent.' });

  } catch (error: any) {
    console.error('Password Reset API Error:', error);
    return NextResponse.json({ error: 'An internal error occurred.' }, { status: 500 });
  }
}
