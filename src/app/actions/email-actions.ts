
'use server';

import { Resend } from 'resend';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';

const resend = new Resend(process.env.RESEND_API_KEY);
const BRAND_COLOR = '#5b52d6';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';
const DEFAULT_LOGO = 'https://cdn.prontly.in/App%20icon/IMG_20260518_203511%20(1).ico';

/**
 * Modern, High-End Email Wrapper (Bento Style)
 */
const emailWrapper = (content: string, preheader: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f9fc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 32px; overflow: hidden; box-shadow: 0 40px 80px rgba(0,0,0,0.05); border: 1px solid #eef2f7; }
    .header { padding: 48px 40px 32px; text-align: center; }
    .logo-img { height: 48px; width: auto; margin-bottom: 16px; border-radius: 12px; }
    .brand-name { font-size: 14px; font-weight: 800; color: #111111; letter-spacing: 0.2em; text-transform: uppercase; margin: 0; }
    .content { padding: 0 48px 48px; line-height: 1.8; color: #4a5568; font-size: 16px; }
    .footer { padding: 48px; text-align: center; font-size: 12px; color: #94a3b8; background-color: #fcfdfe; border-top: 1px solid #f1f5f9; }
    .button { background-color: ${BRAND_COLOR}; color: #ffffff !important; padding: 20px 40px; text-decoration: none; border-radius: 20px; font-weight: 700; display: inline-block; margin: 32px 0; box-shadow: 0 20px 40px rgba(91,82,214,0.2); transition: all 0.2s ease; }
    h1 { margin: 0 0 24px; color: #1a202c; font-size: 32px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.2; }
    p { margin: 0 0 20px; }
    .card { background-color: #f8fafc; border: 1px solid #edf2f7; padding: 32px; border-radius: 24px; margin: 32px 0; }
    .card-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; display: block; }
    .card-value { font-size: 18px; font-weight: 700; color: #1e293b; }
    a { color: ${BRAND_COLOR}; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div style="display: none; max-height: 0px; overflow: hidden;">${preheader}</div>
  <div class="container">
    <div class="header">
      <img src="${DEFAULT_LOGO}" class="logo-img" alt="Prontly Logo" />
      <p class="brand-name">Prontly Digital Ecosystem</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <div style="margin-bottom: 24px;">
        <a href="${SITE_URL}" style="color: #64748b; margin: 0 12px;">Storefront</a>
        <a href="${SITE_URL}/dashboard" style="color: #64748b; margin: 0 12px;">My Library</a>
        <a href="${SITE_URL}/terms" style="color: #64748b; margin: 0 12px;">Terms</a>
      </div>
      &copy; ${new Date().getFullYear()} Prontly Store. Branded Digital Commerce.<br/>
      Delivered securely via Resend Infrastructure.
    </div>
  </div>
</body>
</html>
`;

/**
 * 1. AUTOMATIC WELCOME EMAIL
 */
export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const html = emailWrapper(`
      <h1>Welcome to the Future.</h1>
      <p>Hello ${name.split(' ')[0]}, your creator account has been successfully verified.</p>
      <p>You now have perpetual access to a curated marketplace of production-ready AI prompts, UI kits, and professional guides.</p>
      <center>
        <a href="${SITE_URL}/products" class="button">Explore the Marketplace</a>
      </center>
      <div class="card">
        <span class="card-label">Getting Started</span>
        <span class="card-value">Browse trending assets and add them to your library to accelerate your production workflow.</span>
      </div>
    `, `Welcome to Prontly! Your digital toolkit is ready.`);

    await resend.emails.send({
      from: 'Prontly <hello@store.prontly.in>',
      to: email,
      subject: 'Welcome to the Ecosystem',
      html,
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e };
  }
}

/**
 * 2. BRANDED FORGOT PASSWORD
 */
export async function sendCustomPasswordResetEmail(email: string, resetLink: string) {
  try {
    const html = emailWrapper(`
      <h1>Access Recovery.</h1>
      <p>A request was made to update the credentials for your Prontly account.</p>
      <center>
        <a href="${resetLink}" class="button">Update Password</a>
      </center>
      <div class="card" style="background-color: #fffaf0; border-color: #feebc8;">
        <span class="card-label" style="color: #c05621;">Security Notice</span>
        <span class="card-value" style="color: #744210; font-size: 14px;">This link will expire in 60 minutes. If you did not request this, please contact our security team immediately.</span>
      </div>
    `, `Security: Password reset requested for your Prontly account.`);

    await resend.emails.send({
      from: 'Prontly Security <noreply@store.prontly.in>',
      to: email,
      subject: 'Reset your password',
      html,
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e };
  }
}

/**
 * 3. INVOICE PDF GENERATION (INTERNAL UTILITY)
 */
export async function generateInvoicePdf(order: any, settings?: any) {
  const inv = settings?.invoiceSettings || {};
  const docPdf = new jsPDF() as any;
  const primaryColor = inv.color || BRAND_COLOR;

  // PDF Generation Logic
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(22);
  docPdf.setTextColor(primaryColor);
  docPdf.text(inv.businessName || 'PRONTLY STORE', 20, 30);
  
  docPdf.setFontSize(10);
  docPdf.setTextColor(100);
  docPdf.text('TAX INVOICE & RECEIPT', 20, 42);
  docPdf.text(`ID: #${order.id.toUpperCase().slice(-8)}`, 140, 30);
  docPdf.text(`DATE: ${format(new Date(), 'dd MMM yyyy')}`, 140, 37);

  const tableData = order.items.map((item: any) => [
    item.productName,
    item.quantity || 1,
    `INR ${(item.price / 100).toLocaleString('en-IN')}`,
    `INR ${((item.price * (item.quantity || 1)) / 100).toLocaleString('en-IN')}`
  ]);

  docPdf.autoTable({
    startY: 60,
    head: [['Product Asset', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: primaryColor },
    margin: { left: 20, right: 20 }
  });

  return docPdf.output('datauristring').split(',')[1];
}

/**
 * 4. ORDER CONFIRMATION EMAIL
 */
export async function sendOrderConfirmationEmail(order: any, settings?: any) {
  try {
    const pdfBase64 = await generateInvoicePdf(order, settings);

    const html = emailWrapper(`
      <h1>Order Confirmed.</h1>
      <p>Hello ${order.userName.split(' ')[0]}, your purchase was successful. Your high-performance digital assets are now permanently unlocked in your library.</p>
      <div class="card">
        <div style="margin-bottom: 16px;">
          <span class="card-label">Total Transaction</span>
          <span class="card-value">₹${(order.total / 100).toLocaleString('en-IN')}</span>
        </div>
        <div>
          <span class="card-label">Payment ID</span>
          <span class="card-value">${order.paymentId || 'Verified Transaction'}</span>
        </div>
      </div>
      <center>
        <a href="${SITE_URL}/dashboard" class="button">Access My Digital Library</a>
      </center>
      <p style="font-size: 13px; color: #94a3b8;">A formal PDF tax receipt is attached to this email for your records.</p>
    `, `Your digital assets are ready for download.`);

    await resend.emails.send({
      from: 'Prontly Billing <billing@store.prontly.in>',
      to: order.userEmail,
      subject: `Receipt for Order #${order.id.toUpperCase().slice(-8)}`,
      html,
      attachments: [
        {
          filename: `invoice-${order.id.slice(-8)}.pdf`,
          content: Buffer.from(pdfBase64, 'base64'),
        }
      ]
    });
    return { success: true };
  } catch (e) {
    console.error('Order email failure:', e);
    return { success: false, error: e };
  }
}

/**
 * 5. SECURITY ALERT
 */
export async function sendSecurityAlertEmail(email: string, action: string) {
  try {
    const html = emailWrapper(`
      <h1>Security Alert.</h1>
      <p>This is an automated notification regarding recent activity on your Prontly account.</p>
      <div class="card" style="background-color: #fff5f5; border-color: #feb2b2;">
        <span class="card-label" style="color: #c53030;">Action Detected</span>
        <span class="card-value" style="color: #2d3748;">${action}</span>
      </div>
      <p>If this was you, no further action is required. If you did not perform this action, please secure your account immediately.</p>
      <center>
        <a href="${SITE_URL}/dashboard/settings" class="button">Secure My Account</a>
      </center>
    `, `Security Alert: Recent activity on your account.`);

    await resend.emails.send({
      from: 'Prontly Security <noreply@store.prontly.in>',
      to: email,
      subject: 'Security Alert',
      html,
    });
  } catch (e) {
    console.error('Security alert failure:', e);
  }
}

/**
 * 6. FAILED PAYMENT ALERT
 */
export async function sendFailedPaymentEmail(email: string, amount: number) {
  try {
    const html = emailWrapper(`
      <h1>Payment Unsuccessful.</h1>
      <p>We were unable to process your recent transaction for ₹${(amount / 100).toLocaleString('en-IN')}.</p>
      <p>Don't worry, your cart items have been saved. You can attempt the checkout again using a different payment method.</p>
      <center>
        <a href="${SITE_URL}/checkout" class="button">Retry Checkout</a>
      </center>
    `, `Action Required: Payment failed for your recent order.`);

    await resend.emails.send({
      from: 'Prontly Billing <billing@store.prontly.in>',
      to: email,
      subject: 'Payment Failed',
      html,
    });
  } catch (e) {
    console.error('Failed payment email error:', e);
  }
}
