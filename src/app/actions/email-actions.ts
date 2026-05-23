'use server';

import { Resend } from 'resend';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import nodemailer from 'nodemailer';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const resend = new Resend(process.env.RESEND_API_KEY);
const BRAND_COLOR = '#5b52d6';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';
const DEFAULT_LOGO = 'https://cdn.prontly.in/App%20icon/IMG_20260518_203511%20(1).ico';

/**
 * Initialize Firebase Admin securely for Server Actions
 */
function getAdminAuth() {
  if (getApps().length === 0) {
    initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
  return getAuth();
}

/**
 * Global SMTP Transporter Factory
 */
const getTransporter = (config?: any) => {
  // If host or pass is missing, return null to fallback to Resend
  if (!config || !config.host || !config.pass) return null;
  
  return nodemailer.createTransport({
    host: config.host,
    port: parseInt(config.port) || 465,
    secure: config.secure !== false,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
};

/**
 * Modern Email Design Wrapper
 */
const emailWrapper = (content: string, preheader: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f6f9fc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #eef2f7; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
    .header { padding: 40px; text-align: center; }
    .logo { height: 48px; width: auto; border-radius: 12px; }
    .content { padding: 0 40px 40px; color: #4a5568; line-height: 1.6; font-size: 16px; }
    .footer { padding: 40px; text-align: center; font-size: 12px; color: #94a3b8; background-color: #fcfdfe; }
    .button { background-color: ${BRAND_COLOR}; color: #ffffff !important; padding: 16px 32px; text-decoration: none; border-radius: 16px; font-weight: 700; display: inline-block; margin: 24px 0; }
    .card { background-color: #f8fafc; border-radius: 20px; padding: 24px; margin: 24px 0; border: 1px solid #edf2f7; }
    h1 { color: #1a202c; font-size: 28px; font-weight: 800; margin: 0 0 16px; }
    a { color: ${BRAND_COLOR}; text-decoration: none; }
  </style>
</head>
<body>
  <div style="display: none; max-height: 0px; overflow: hidden;">${preheader}</div>
  <div class="container">
    <div class="header">
      <img src="${DEFAULT_LOGO}" class="logo" alt="Prontly" />
    </div>
    <div class="content">${content}</div>
    <div class="footer">&copy; ${new Date().getFullYear()} Prontly Store. Branded Digital Commerce.</div>
  </div>
</body>
</html>
`;

/**
 * 1. TRANSACTIONAL: WELCOME EMAIL
 */
export async function sendWelcomeEmail(email: string, name: string, settings?: any) {
  try {
    const html = emailWrapper(`
      <h1>Welcome to Prontly.</h1>
      <p>Hello ${name}, your creator account is now active.</p>
      <p>You have joined an elite group of creators using high-performance AI prompts and UI templates to build the future.</p>
      <center><a href="${SITE_URL}/products" class="button">Explore the Marketplace</a></center>
    `, "Welcome to the future of digital creation.");

    const smtp = getTransporter(settings?.smtpConfig);
    if (smtp) {
      await smtp.sendMail({
        from: `"${settings?.emailSettings?.senderName || 'Prontly Store'}" <${settings?.emailSettings?.fromEmail || 'hello@store.prontly.in'}>`,
        to: email,
        subject: 'Welcome to the Ecosystem',
        html,
      });
    } else {
      await resend.emails.send({
        from: 'Prontly <hello@store.prontly.in>',
        to: email,
        subject: 'Welcome to the Ecosystem',
        html,
      });
    }
    return { success: true };
  } catch (e) {
    console.error('Welcome email error:', e);
    return { success: false };
  }
}

/**
 * 2. TRANSACTIONAL: PASSWORD RESET
 */
export async function initiateBrandedPasswordReset(email: string, settings?: any) {
  try {
    const adminAuth = getAdminAuth();
    const link = await adminAuth.generatePasswordResetLink(email, {
      url: `${SITE_URL}/login`,
    });

    const oobCode = new URL(link).searchParams.get('oobCode');
    const brandedLink = `${SITE_URL}/reset-password?oobCode=${oobCode}`;

    const html = emailWrapper(`
      <h1>Access Recovery.</h1>
      <p>A request was made to reset your Prontly account credentials.</p>
      <center><a href="${brandedLink}" class="button">Reset Password</a></center>
      <div class="card">
        <p style="margin: 0; font-size: 13px;">This secure link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
      </div>
    `, "Reset your Prontly account password.");

    const smtp = getTransporter(settings?.smtpConfig);
    const from = settings?.emailSettings?.fromEmail || 'noreply@store.prontly.in';

    if (smtp) {
      await smtp.sendMail({
        from: `"${settings?.emailSettings?.senderName || 'Prontly Security'}" <${from}>`,
        to: email,
        subject: 'Reset your password',
        html,
      });
    } else {
      await resend.emails.send({
        from: `Prontly Security <${from}>`,
        to: email,
        subject: 'Reset your password',
        html,
      });
    }
    return { success: true };
  } catch (e: any) {
    console.error('Reset dispatch error:', e);
    return { success: false, error: e.message };
  }
}

/**
 * 3. SHARED: INVOICE PDF GENERATION
 */
export async function generateInvoicePdf(order: any, settings?: any) {
  const inv = settings?.invoiceSettings || {};
  const docPdf = new jsPDF() as any;
  const primaryColor = inv.color || BRAND_COLOR;

  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(22);
  docPdf.setTextColor(primaryColor);
  docPdf.text(inv.businessName || 'PRONTLY STORE', 20, 30);
  
  docPdf.setFontSize(10);
  docPdf.setTextColor(100);
  docPdf.text('TAX INVOICE', 20, 42);
  docPdf.text(`ID: #${order.id.toUpperCase().slice(-8)}`, 140, 30);
  docPdf.text(`DATE: ${format(new Date(), 'dd MMM yyyy')}`, 140, 37);

  const tableData = (order.items || []).map((item: any) => [
    item.productName || 'Digital Asset',
    item.quantity || 1,
    `INR ${((item.price || 0) / 100).toLocaleString('en-IN')}`,
    `INR ${(((item.price || 0) * (item.quantity || 1)) / 100).toLocaleString('en-IN')}`
  ]);

  docPdf.autoTable({
    startY: 60,
    head: [['Asset', 'Qty', 'Unit', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: primaryColor },
    margin: { left: 20, right: 20 }
  });

  // Final summary
  const finalY = (docPdf as any).lastAutoTable.finalY + 10;
  docPdf.setFontSize(12);
  docPdf.setTextColor(0);
  docPdf.text(`TOTAL AMOUNT: INR ${(order.total / 100).toLocaleString('en-IN')}`, 130, finalY);

  return docPdf.output('datauristring').split(',')[1];
}

/**
 * 4. TRANSACTIONAL: ORDER CONFIRMATION
 */
export async function sendOrderConfirmationEmail(order: any, settings?: any) {
  try {
    const pdfBase64 = await generateInvoicePdf(order, settings);
    const html = emailWrapper(`
      <h1>Order Confirmed.</h1>
      <p>Hello ${order.userName || 'Creator'}, your purchase was successful. Your assets are now permanently unlocked.</p>
      <div class="card">
        <strong>Total: ₹${(order.total / 100).toLocaleString('en-IN')}</strong><br/>
        <small>Payment ID: ${order.paymentId}</small>
      </div>
      <center><a href="${SITE_URL}/dashboard" class="button">Access My Library</a></center>
    `, "Your digital assets are ready for download.");

    const smtp = getTransporter(settings?.smtpConfig);
    const from = settings?.emailSettings?.fromEmail || 'billing@store.prontly.in';
    const senderName = settings?.emailSettings?.senderName || 'Prontly Billing';

    if (smtp) {
      await smtp.sendMail({
        from: `"${senderName}" <${from}>`,
        to: order.userEmail,
        subject: `Receipt for Order #${order.id.slice(-6)}`,
        html,
        attachments: [{ filename: 'invoice.pdf', content: Buffer.from(pdfBase64, 'base64') }]
      });
    } else {
      await resend.emails.send({
        from: `${senderName} <${from}>`,
        to: order.userEmail,
        subject: `Receipt for Order #${order.id.slice(-6)}`,
        html,
        attachments: [{ filename: 'invoice.pdf', content: Buffer.from(pdfBase64, 'base64') }]
      });
    }
    return { success: true };
  } catch (e) {
    console.error('Order confirmation error:', e);
    return { success: false, error: 'Failed to dispatch email' };
  }
}
