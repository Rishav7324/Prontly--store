'use server';

import { Resend } from 'resend';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

const resend = new Resend(process.env.RESEND_API_KEY);
const BRAND_COLOR = '#5b52d6';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';
const DEFAULT_LOGO = 'https://cdn.prontly.in/App%20icon/IMG_20260518_203511%20(1).ico';

const emailWrapper = (content: string, preheader: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #f9f9fb; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; overflow: hidden; border-radius: 24px; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.05); border: 1px solid #eef0f5; }
    .header { background-color: #ffffff; padding: 40px; text-align: center; border-bottom: 1px solid #f1f1f4; }
    .content { padding: 40px; line-height: 1.7; color: #333333; }
    .footer { padding: 40px; text-align: center; font-size: 11px; color: #99aab5; background-color: #fcfcfd; border-top: 1px solid #f1f1f4; letter-spacing: 0.02em; }
    .button { background-color: ${BRAND_COLOR}; color: #ffffff !important; padding: 16px 32px; text-decoration: none; border-radius: 14px; font-weight: bold; display: inline-block; margin-top: 24px; box-shadow: 0 10px 20px rgba(91,82,214,0.2); }
    .logo-img { height: 40px; width: auto; margin-bottom: 16px; }
    .brand-name { font-size: 20px; font-weight: 900; color: #111111; letter-spacing: -0.04em; }
    h1 { margin-top: 0; color: #111111; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 24px; }
    p { margin-bottom: 20px; font-size: 16px; color: #4a5568; }
    .order-card { background-color: #f8fafc; border: 1px solid #edf2f7; padding: 24px; border-radius: 16px; margin: 32px 0; }
  </style>
</head>
<body>
  <div style="display: none; max-height: 0px; overflow: hidden;">${preheader}</div>
  <div class="container">
    <div class="header">
      <img src="${DEFAULT_LOGO}" class="logo-img" alt="Logo" />
      <div class="brand-name">PRONTLY</div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Prontly Digital Store. Verified Digital Goods.<br/>
      <a href="${SITE_URL}/privacy" style="color: ${BRAND_COLOR}; font-weight: 600;">Privacy</a> &bull; <a href="${SITE_URL}/terms" style="color: ${BRAND_COLOR}; font-weight: 600;">Terms</a>
    </div>
  </div>
</body>
</html>
`;

/**
 * Generates a base64 encoded PDF invoice.
 */
export async function generateInvoicePdf(order: any, settings?: any) {
  const inv = settings?.invoiceSettings || {};
  const docPdf = new jsPDF() as any;
  const margin = 20;
  const primaryColor = inv.color || BRAND_COLOR;
  const logoUrl = inv.logoUrl || DEFAULT_LOGO;

  try {
    const response = await fetch(logoUrl);
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    docPdf.addImage(base64, 'PNG', margin, 15, 12, 12);
    docPdf.setFontSize(22);
    docPdf.setTextColor(primaryColor);
    docPdf.text(inv.businessName || 'PRONTLY STORE', margin + 15, 25);
  } catch (e) {
    docPdf.setFontSize(22);
    docPdf.setTextColor(primaryColor);
    docPdf.text(inv.businessName || 'PRONTLY STORE', margin, 30);
  }
  
  docPdf.setFontSize(9);
  docPdf.setTextColor(100);
  const addressLines = inv.address ? inv.address.split('\n') : ['Premium Digital Marketplace'];
  addressLines.forEach((line: string, i: number) => {
    docPdf.text(line, margin, 38 + (i * 5));
  });
  
  docPdf.setFontSize(12);
  docPdf.setTextColor(0);
  docPdf.text(`RECEIPT: #${order.id.toUpperCase().slice(-8)}`, 140, 30);
  docPdf.text(`Date: ${format(new Date(), 'dd MMM yyyy')}`, 140, 36);

  docPdf.setFontSize(10);
  docPdf.text('Billed To:', margin, 75);
  docPdf.setFont(undefined, 'bold');
  docPdf.text(order.userName, margin, 80);
  docPdf.setFont(undefined, 'normal');
  docPdf.text(order.userEmail, margin, 85);

  const tableData = order.items.map((item: any) => [
    item.productName,
    item.quantity || 1,
    `INR ${(item.price / 100).toLocaleString('en-IN')}`,
    `INR ${((item.price * (item.quantity || 1)) / 100).toLocaleString('en-IN')}`
  ]);

  const hex = primaryColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  docPdf.autoTable({
    startY: 100,
    head: [['Asset Name', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    headStyles: { fillColor: [r, g, b] },
    margin: { left: margin, right: margin }
  });

  const finalY = (docPdf as any).lastAutoTable.finalY + 10;
  docPdf.text('Subtotal:', 140, finalY);
  docPdf.text(`INR ${(order.subtotal / 100).toLocaleString('en-IN')}`, 175, finalY, { align: 'right' });
  
  if (order.discount > 0) {
    docPdf.text('Discount:', 140, finalY + 7);
    docPdf.text(`-INR ${(order.discount / 100).toLocaleString('en-IN')}`, 175, finalY + 7, { align: 'right' });
  }
  
  docPdf.setFontSize(14);
  docPdf.setFont(undefined, 'bold');
  docPdf.text('Total Amount Paid:', 140, finalY + 16);
  docPdf.text(`INR ${(order.total / 100).toLocaleString('en-IN')}`, 175, finalY + 16, { align: 'right' });

  docPdf.setFontSize(8);
  docPdf.setFont(undefined, 'normal');
  docPdf.setTextColor(150);
  docPdf.text(inv.footerText || 'Digital assets are delivered instantly. No physical shipping is required.', margin, 280);

  return docPdf.output('datauristring').split(',')[1];
}

export async function sendOrderConfirmationEmail(order: any, settings?: any) {
  if (!process.env.RESEND_API_KEY) return { success: false };

  const fromEmail = settings?.emailSettings?.fromEmail || 'support@store.prontly.in';
  const senderName = settings?.emailSettings?.senderName || 'Prontly Store';

  try {
    const pdfBase64 = await generateInvoicePdf(order, settings);

    const html = emailWrapper(`
      <h1>Thank you for your order!</h1>
      <p>Hi ${order.userName}, your purchase was successful. Your high-performance digital assets are now permanently unlocked in your library.</p>
      <div class="order-card">
        <strong>Receipt ID:</strong> #${order.id.toUpperCase().slice(-8)}<br/>
        <strong>Total Paid:</strong> ₹${(order.total / 100).toLocaleString('en-IN')}
      </div>
      <p>Access and download your assets anytime by visiting your personal dashboard.</p>
      <center><a href="${SITE_URL}/dashboard" class="button">Access My Digital Library</a></center>
      <p style="font-size: 12px; color: #777; margin-top: 32px; font-style: italic;">A copy of your purchase receipt is attached to this email for your records.</p>
    `, `Your digital assets are ready for download.`);

    await resend.emails.send({
      from: `${senderName} <${fromEmail}>`,
      to: order.userEmail,
      subject: `Your Receipt: #${order.id.toUpperCase().slice(-8)}`,
      html,
      attachments: [
        {
          filename: `receipt-${order.id.slice(-8)}.pdf`,
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

export async function sendWelcomeEmail(email: string, name: string, settings?: any) {
  if (!process.env.RESEND_API_KEY) return { success: false, error: 'API key missing' };
  
  const fromEmail = settings?.emailSettings?.fromEmail || 'support@store.prontly.in';
  const senderName = settings?.emailSettings?.senderName || 'Prontly Store';

  const html = emailWrapper(`
    <h1>Welcome to the Community, ${name}!</h1>
    <p>We're thrilled to have you at Prontly. You now have access to a hand-curated marketplace of production-ready AI prompts, UI kits, and professional guides.</p>
    <p>Get started by exploring our latest trending assets or complete your profile to receive personalized recommendations for your workflow.</p>
    <center><a href="${SITE_URL}/products" class="button">Browse the Marketplace</a></center>
    <p style="margin-top: 32px;">To your success,<br/>The Prontly Team</p>
  `, `Welcome to the future of high-speed creation.`);

  try {
    await resend.emails.send({
      from: `${senderName} <${fromEmail}>`,
      to: email,
      subject: 'Welcome to Prontly!',
      html,
    });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function sendPasswordResetEmail(email: string, settings?: any) {
  if (!process.env.RESEND_API_KEY) return;
  
  const fromEmail = settings?.emailSettings?.fromEmail || 'support@store.prontly.in';
  const senderName = settings?.emailSettings?.senderName || 'Prontly Store';

  const html = emailWrapper(`
    <h1>Security Notification</h1>
    <p>A request was made to reset the password for your Prontly account. If you didn't initiate this, you can safely ignore this email.</p>
    <p>Please follow the link sent by our authentication provider to choose a new password. For your security, this link is only valid for a limited time.</p>
    <center><a href="${SITE_URL}/blog" class="button">Visit Security Center</a></center>
  `, `Security Alert: Password Reset Requested.`);

  try {
    await resend.emails.send({
      from: `${senderName} Security <${fromEmail}>`,
      to: email,
      subject: 'Security Alert: Password Reset',
      html,
    });
  } catch (e) {
    console.error('Reset notification failed:', e);
  }
}