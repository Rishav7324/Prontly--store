
'use server';

import { Resend } from 'resend';

/**
 * @fileOverview Universal Email Dispatcher for Prontly Store.
 * Centralizes all email communication via Resend API.
 */

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || 'Prontly Store <noreply@store.prontly.in>';

// Internal synchronous helpers for HTML generation
function welcomeEmailTemplate(name: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.05);">
          <tr><td style="background:#1F4E79;padding:40px;text-align:center;"><h1 style="color:#ffffff;margin:0;">🚀 Prontly Store</h1></td></tr>
          <tr><td style="padding:48px;">
            <h2 style="margin:0 0 16px;color:#1A1A2E;">Welcome, ${name}! 🎉</h2>
            <p style="color:#444;line-height:1.7;">Your premium access is now ready. Start browsing our curated AI prompts and digital assets today.</p>
            <div style="text-align:center;margin:32px 0;"><a href="https://store.prontly.in/products" style="background:#1F4E79;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:bold;">Browse Products</a></div>
          </td></tr>
          <tr><td style="background:#F8FAFC;padding:20px;text-align:center;color:#999;font-size:12px;">© ${new Date().getFullYear()} Prontly Store</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── SENDER ACTIONS ─────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");
    
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `🎉 Welcome to Prontly Store, ${name}!`,
      html: welcomeEmailTemplate(name),
    });
    return { success: true };
  } catch (e: any) {
    console.error('Welcome email dispatch failed:', e.message);
    return { success: false, error: e.message };
  }
}
