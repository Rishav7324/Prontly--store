
'use server';

import { Resend } from 'resend';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { getAdminAuth } from '@/lib/firebase-admin';

/**
 * @fileOverview Centralized Email & Document Dispatcher.
 * Exports all Server Actions required by the Storefront and Admin Panel.
 */

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || 'Prontly Store <noreply@store.prontly.in>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';

// ─── INTERNAL TEMPLATES ──────────────────────────────────────────────────────

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
            <div style="text-align:center;margin:32px 0;"><a href="${SITE_URL}/products" style="background:#1F4E79;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:bold;">Browse Products</a></div>
          </td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function resetPasswordEmailTemplate(name: string, resetLink: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.05);">
          <tr><td style="background:#1F4E79;padding:40px;text-align:center;"><h1 style="color:#ffffff;margin:0;">🔐 Account Security</h1></td></tr>
          <tr><td style="padding:48px;text-align:center;">
            <h2 style="margin:0 0 16px;color:#1A1A2E;">Password Reset Request</h2>
            <p style="color:#444;line-height:1.7;">Hi ${name}, click the button below to secure your account and set a new password. This link expires in 15 minutes.</p>
            <div style="text-align:center;margin:32px 0;"><a href="${resetLink}" style="background:#5b52d6;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-weight:bold;box-shadow:0 10px 20px rgba(91, 82, 214, 0.2);">Reset My Password</a></div>
            <p style="font-size:12px;color:#999;">If you didn't request this, ignore this email.</p>
          </td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── EXPORTED SERVER ACTIONS ─────────────────────────────────────────────────

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
    return { success: false, error: e.message };
  }
}

/**
 * Generates a secure recovery link and sends a branded reset email.
 */
export async function sendForgotPasswordEmail(email: string) {
  try {
    const auth = getAdminAuth();
    
    // 1. Check if user exists (generic response if not to prevent enumeration)
    let user;
    try {
      user = await auth.getUserByEmail(email);
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') return { success: true };
      throw e;
    }

    // 2. Generate OOB Link
    const firebaseLink = await auth.generatePasswordResetLink(email, {
      url: `${SITE_URL}/login`,
    });

    // 3. Extract code for branded URL
    const urlObj = new URL(firebaseLink);
    const oobCode = urlObj.searchParams.get('oobCode');
    const brandedLink = `${SITE_URL}/reset-password?oobCode=${oobCode}`;

    // 4. Send Branded Email
    await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: '🔐 Secure Password Reset — Prontly Store',
      html: resetPasswordEmailTemplate(user.displayName || 'Creator', brandedLink),
    });

    return { success: true };
  } catch (e: any) {
    console.error('Branded Reset Failed:', e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Handles purchase confirmations.
 */
export async function sendOrderConfirmationEmail(order: any) {
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to: order.userEmail,
      subject: `✅ Order Confirmed #${order.id.slice(-8).toUpperCase()} — Prontly Store`,
      html: `
        <h1>Order Confirmation</h1>
        <p>Hi ${order.userName}, your purchase is verified.</p>
        <p>Order ID: ${order.id}</p>
        <p>Total: ₹${(order.total / 100).toLocaleString('en-IN')}</p>
        <a href="${SITE_URL}/dashboard">Access Downloads</a>
      `,
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Generates a professional PDF invoice as a Base64 string.
 */
export async function generateInvoicePdf(order: any, settings: any) {
  try {
    const doc = new jsPDF();
    const invSettings = settings?.invoiceSettings || {};

    // Header
    doc.setFontSize(20);
    doc.setTextColor(invSettings.color || '#1F4E79');
    doc.text(invSettings.businessName || 'PRONTLY STORE', 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('TAX INVOICE / RECEIPT', 150, 20);
    doc.text(`ID: ${order.id.toUpperCase()}`, 150, 25);

    // Bill To
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('BILL TO:', 20, 45);
    doc.setFontSize(10);
    doc.text(order.userName, 20, 52);
    doc.text(order.userEmail, 20, 57);

    // Table
    (doc as any).autoTable({
      startY: 70,
      head: [['Product', 'Quantity', 'Price']],
      body: order.items.map((i: any) => [
        i.productName,
        i.quantity || 1,
        `INR ${(i.price / 100).toLocaleString()}`
      ]),
      theme: 'grid',
      headStyles: { fillColor: invSettings.color || '#1F4E79' }
    });

    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Subtotal: INR ${(order.subtotal / 100).toLocaleString()}`, 140, finalY);
    if (order.discount > 0) doc.text(`Discount: -INR ${(order.discount / 100).toLocaleString()}`, 140, finalY + 7);
    doc.setFontSize(14);
    doc.text(`Total Paid: INR ${(order.total / 100).toLocaleString()}`, 140, finalY + 17);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(invSettings.footerText || 'Thank you for your business.', 20, 280);

    return doc.output('datauristring').split(',')[1];
  } catch (e: any) {
    console.error('PDF Gen Error:', e);
    throw new Error('Failed to generate PDF');
  }
}
