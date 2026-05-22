
'use server';

import { Resend } from 'resend';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

const resend = new Resend(process.env.RESEND_API_KEY);
const BRAND_COLOR = '#5b52d6';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';

/**
 * Common HTML wrapper for premium email look.
 */
const emailWrapper = (content: string, preheader: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f9f9fb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; overflow: hidden; border-radius: 12px; }
    .header { background-color: ${BRAND_COLOR}; padding: 40px; text-align: center; }
    .content { padding: 40px; line-height: 1.6; color: #333333; }
    .footer { padding: 30px; text-align: center; font-size: 12px; color: #888888; background-color: #f1f1f4; }
    .button { background-color: ${BRAND_COLOR}; color: #ffffff !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin-top: 20px; }
    .logo { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.05em; }
    h1 { margin-top: 0; color: #111111; font-size: 24px; }
  </style>
</head>
<body>
  <div style="display: none; max-height: 0px; overflow: hidden;">${preheader}</div>
  <div class="container">
    <div class="header">
      <div class="logo">PRONTLY</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Prontly Store. Patna, Bihar, India.<br/>
      <a href="${SITE_URL}/privacy" style="color: ${BRAND_COLOR};">Privacy Policy</a> &bull; <a href="${SITE_URL}/terms" style="color: ${BRAND_COLOR};">Terms of Service</a>
    </div>
  </div>
</body>
</html>
`;

/**
 * Sends a welcome email to new users.
 */
export async function sendWelcomeEmail(email: string, name: string) {
  if (!process.env.RESEND_API_KEY) return { success: false, error: 'API key missing' };

  const html = emailWrapper(`
    <h1>Welcome to Prontly, ${name}!</h1>
    <p>We're thrilled to have you in our community of professional creators. You now have access to a marketplace of high-performance AI prompts, UI kits, and digital templates designed to accelerate your workflow.</p>
    <p>Get started by exploring our latest assets or completing your profile to receive personalized recommendations.</p>
    <center><a href="${SITE_URL}/products" class="button">Browse Marketplace</a></center>
    <p style="margin-top: 30px;">Best regards,<br/>The Prontly Team</p>
  `, `Welcome to the future of digital creation.`);

  try {
    await resend.emails.send({
      from: 'Prontly <onboarding@resend.dev>', // Replace with your domain once verified
      to: email,
      subject: 'Welcome to Prontly!',
      html,
    });
    return { success: true };
  } catch (error) {
    console.error('Email failed:', error);
    return { success: false };
  }
}

/**
 * Sends a password reset notification.
 */
export async function sendPasswordResetEmail(email: string) {
  if (!process.env.RESEND_API_KEY) return;

  const html = emailWrapper(`
    <h1>Password Reset Request</h1>
    <p>We received a request to reset the password for your Prontly account. If you didn't make this request, you can safely ignore this email.</p>
    <p>If you intended to reset your password, please follow the link sent by Firebase to choose a new one. For security, never share your reset link with anyone.</p>
    <p>Need help? Reach out to our support team.</p>
    <center><a href="${SITE_URL}/blog" class="button">Visit Support Blog</a></center>
  `, `Security alert: Password reset requested.`);

  try {
    await resend.emails.send({
      from: 'Prontly Security <security@resend.dev>',
      to: email,
      subject: 'Security Alert: Password Reset Requested',
      html,
    });
  } catch (e) {
    console.error('Reset notification failed:', e);
  }
}

/**
 * Sends order confirmation with a PDF invoice attachment.
 */
export async function sendOrderConfirmationEmail(order: any) {
  if (!process.env.RESEND_API_KEY) return { success: false };

  // 1. Generate PDF Invoice using jsPDF
  const doc = new jsPDF() as any;
  const margin = 20;
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(BRAND_COLOR);
  doc.text('PRONTLY STORE', margin, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Digital Assets Marketplace', margin, 36);
  
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`INVOICE: #${order.id.toUpperCase().slice(-8)}`, 140, 30);
  doc.text(`Date: ${format(new Date(), 'dd MMM yyyy')}`, 140, 36);

  // Billing Details
  doc.setFontSize(10);
  doc.text('Billed To:', margin, 60);
  doc.setFont(undefined, 'bold');
  doc.text(order.userName, margin, 65);
  doc.setFont(undefined, 'normal');
  doc.text(order.userEmail, margin, 70);
  if (order.gstNumber) doc.text(`GST: ${order.gstNumber}`, margin, 75);

  // Table
  const tableData = order.items.map((item: any) => [
    item.productName,
    item.quantity,
    `INR ${(item.price / 100).toLocaleString('en-IN')}`,
    `INR ${(item.price * item.quantity / 100).toLocaleString('en-IN')}`
  ]);

  doc.autoTable({
    startY: 90,
    head: [['Product', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    headStyles: { fillColor: [91, 82, 214] }, // Brand color
    margin: { left: margin, right: margin }
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.text('Subtotal:', 140, finalY);
  doc.text(`INR ${(order.subtotal / 100).toLocaleString('en-IN')}`, 175, finalY, { align: 'right' });
  
  doc.text('GST (18%):', 140, finalY + 7);
  doc.text(`INR ${(order.gst / 100).toLocaleString('en-IN')}`, 175, finalY + 7, { align: 'right' });
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Grand Total:', 140, finalY + 16);
  doc.text(`INR ${(order.total / 100).toLocaleString('en-IN')}`, 175, finalY + 16, { align: 'right' });

  // Convert to Base64
  const pdfBase64 = doc.output('datauristring').split(',')[1];

  // 2. Prepare HTML Content
  const html = emailWrapper(`
    <h1>Order Confirmed!</h1>
    <p>Hi ${order.userName}, thank you for your purchase! Your payment was successful, and your digital assets are now ready for use.</p>
    <div style="background-color: #f8f8fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <strong>Order ID:</strong> #${order.id.toUpperCase().slice(-8)}<br/>
      <strong>Total Paid:</strong> INR ${(order.total / 100).toLocaleString('en-IN')}
    </div>
    <p>You can download your assets anytime by visiting your personal library dashboard.</p>
    <center><a href="${SITE_URL}/dashboard" class="button">Access My Library</a></center>
    <p style="font-size: 12px; color: #777; margin-top: 30px;">A detailed tax invoice is attached to this email for your records.</p>
  `, `Thanks for your order! Your digital assets are ready.`);

  try {
    await resend.emails.send({
      from: 'Prontly Orders <orders@resend.dev>',
      to: order.userEmail,
      subject: `Order Confirmation: #${order.id.toUpperCase().slice(-8)}`,
      html,
      attachments: [
        {
          filename: `invoice-${order.id.slice(-8)}.pdf`,
          content: pdfBase64,
        }
      ]
    });
    return { success: true };
  } catch (error) {
    console.error('Order email failed:', error);
    return { success: false };
  }
}
