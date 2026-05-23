'use server';

import { Resend } from 'resend';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

const resend = new Resend(process.env.RESEND_API_KEY);
const BRAND_COLOR = '#5b52d6';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';
const DEFAULT_LOGO = 'https://cdn.prontly.in/App%20icon/IMG_20260518_203511%20(1).ico';

/**
 * Modern, High-End Email Wrapper
 */
const emailWrapper = (content: string, preheader: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f6f9fc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.03); border: 1px solid #eef2f7; }
    .header { padding: 48px 40px 32px; text-align: center; }
    .logo-img { height: 48px; width: auto; margin-bottom: 16px; border-radius: 12px; }
    .brand-name { font-size: 14px; font-weight: 800; color: #111111; letter-spacing: 0.2em; text-transform: uppercase; margin: 0; }
    .content { padding: 0 48px 48px; line-height: 1.8; color: #4a5568; font-size: 16px; }
    .footer { padding: 48px; text-align: center; font-size: 12px; color: #94a3b8; background-color: #fcfdfe; border-top: 1px solid #f1f5f9; }
    .button { background-color: ${BRAND_COLOR}; color: #ffffff !important; padding: 18px 36px; text-decoration: none; border-radius: 16px; font-weight: 700; display: inline-block; margin: 32px 0; box-shadow: 0 10px 20px rgba(91,82,214,0.15); transition: all 0.2s ease; }
    h1 { margin: 0 0 24px; color: #1a202c; font-size: 32px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.2; }
    p { margin: 0 0 20px; }
    .card { background-color: #f8fafc; border: 1px solid #edf2f7; padding: 32px; border-radius: 20px; margin: 32px 0; }
    .card-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; display: block; }
    .card-value { font-size: 18px; font-weight: 700; color: #1e293b; }
    .divider { height: 1px; background-color: #e2e8f0; margin: 32px 0; border: none; }
    a { color: ${BRAND_COLOR}; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div style="display: none; max-height: 0px; overflow: hidden;">${preheader}</div>
  <div class="container">
    <div class="header">
      <img src="${DEFAULT_LOGO}" class="logo-img" alt="Store Logo" />
      <p class="brand-name">Prontly Store</p>
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
      &copy; ${new Date().getFullYear()} Prontly Digital Ecosystem. All Rights Reserved.<br/>
      Patna, Bihar, India. Verified Digital Merchant.
    </div>
  </div>
</body>
</html>
`;

/**
 * Premium jsPDF Invoice Engine
 */
export async function generateInvoicePdf(order: any, settings?: any) {
  const inv = settings?.invoiceSettings || {};
  const docPdf = new jsPDF() as any;
  const margin = 20;
  const primaryColor = inv.color || BRAND_COLOR;
  const logoUrl = inv.logoUrl || DEFAULT_LOGO;

  // Header Branding
  try {
    const response = await fetch(logoUrl);
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    docPdf.addImage(base64, 'PNG', margin, 20, 12, 12);
  } catch (e) {
    // Fallback if logo fails
  }
  
  docPdf.setFont('helvetica', 'bold');
  docPdf.setFontSize(18);
  docPdf.setTextColor(primaryColor);
  docPdf.text(inv.businessName || 'PRONTLY STORE', margin + 15, 29);

  // Document Info
  docPdf.setFont('helvetica', 'normal');
  docPdf.setFontSize(9);
  docPdf.setTextColor(120);
  docPdf.text('TAX INVOICE & RECEIPT', margin, 42);
  
  docPdf.setFontSize(11);
  docPdf.setTextColor(0);
  docPdf.text(`ID: #${order.id.toUpperCase().slice(-12)}`, 140, 30);
  docPdf.text(`DATE: ${format(new Date(), 'dd MMM yyyy')}`, 140, 37);

  // Divider
  docPdf.setDrawColor(240);
  docPdf.line(margin, 50, 190, 50);

  // Billed To Section
  docPdf.setFontSize(10);
  docPdf.setTextColor(150);
  docPdf.text('BILLED TO', margin, 65);
  docPdf.setFontSize(12);
  docPdf.setTextColor(0);
  docPdf.setFont('helvetica', 'bold');
  docPdf.text(order.userName, margin, 72);
  docPdf.setFont('helvetica', 'normal');
  docPdf.setFontSize(10);
  docPdf.text(order.userEmail, margin, 78);

  // Company Address (From Settings)
  docPdf.setTextColor(150);
  docPdf.text('MERCHANT', 140, 65);
  docPdf.setTextColor(0);
  const addressLines = inv.address ? inv.address.split('\n') : ['Prontly Digital Marketplace', 'Patna, Bihar'];
  addressLines.forEach((line: string, i: number) => {
    docPdf.text(line, 140, 72 + (i * 5));
  });

  // Items Table
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
    head: [['Product Asset', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [r, g, b], fontSize: 10, cellPadding: 5 },
    bodyStyles: { fontSize: 9, cellPadding: 5 },
    alternateRowStyles: { fillColor: [250, 250, 252] },
    margin: { left: margin, right: margin }
  });

  // Summary
  const finalY = (docPdf as any).lastAutoTable.finalY + 15;
  docPdf.setFontSize(10);
  docPdf.setTextColor(120);
  docPdf.text('Subtotal:', 130, finalY);
  docPdf.setTextColor(0);
  docPdf.text(`INR ${(order.subtotal / 100).toLocaleString('en-IN')}`, 190, finalY, { align: 'right' });
  
  if (order.discount > 0) {
    docPdf.setTextColor(20, 150, 20);
    docPdf.text(`Discount (${order.couponCode || 'PROMO'}):`, 130, finalY + 7);
    docPdf.text(`-INR ${(order.discount / 100).toLocaleString('en-IN')}`, 190, finalY + 7, { align: 'right' });
  }
  
  docPdf.setFontSize(14);
  docPdf.setFont('helvetica', 'bold');
  docPdf.setTextColor(primaryColor);
  docPdf.text('Total Paid:', 130, finalY + 18);
  docPdf.text(`INR ${(order.total / 100).toLocaleString('en-IN')}`, 190, finalY + 18, { align: 'right' });

  // Footer
  docPdf.setFontSize(8);
  docPdf.setFont('helvetica', 'normal');
  docPdf.setTextColor(180);
  const footerText = inv.footerText || 'Digital assets are delivered instantly via your account dashboard. No physical shipment required.';
  docPdf.text(footerText, margin, 280, { maxWidth: 170 });

  return docPdf.output('datauristring').split(',')[1];
}

export async function sendOrderConfirmationEmail(order: any, settings?: any) {
  if (!process.env.RESEND_API_KEY) return { success: false };

  const fromEmail = settings?.emailSettings?.fromEmail || 'support@store.prontly.in';
  const senderName = settings?.emailSettings?.senderName || 'Prontly Store';

  try {
    const pdfBase64 = await generateInvoicePdf(order, settings);

    const html = emailWrapper(`
      <h1>Order Confirmed.</h1>
      <p>Hello ${order.userName.split(' ')[0]}, your purchase was successful. Your high-performance digital assets are now permanently unlocked in your personal library.</p>
      
      <div class="card">
        <div style="margin-bottom: 24px;">
          <span class="card-label">Transaction ID</span>
          <span class="card-value">#${order.id.toUpperCase().slice(-12)}</span>
        </div>
        <div>
          <span class="card-label">Amount Invested</span>
          <span class="card-value" style="color: ${BRAND_COLOR};">₹${(order.total / 100).toLocaleString('en-IN')}</span>
        </div>
      </div>

      <p>You can access and download your source files anytime by visiting your secure dashboard.</p>
      
      <center>
        <a href="${SITE_URL}/dashboard" class="button">Access My Digital Library</a>
      </center>

      <div class="divider"></div>
      
      <p style="font-size: 13px; color: #94a3b8; font-style: italic;">
        Note: A formal PDF receipt is attached to this email for your records. Digital assets are delivered under a perpetual usage license.
      </p>
    `, `Your digital assets are ready for download.`);

    await resend.emails.send({
      from: `${senderName} <${fromEmail}>`,
      to: order.userEmail,
      subject: `Invoice: #${order.id.toUpperCase().slice(-8)}`,
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
    <h1>Welcome to the Ecosystem.</h1>
    <p>We're thrilled to have you, ${name.split(' ')[0]}. You now have access to a curated marketplace of production-ready AI prompts, UI kits, and professional guides.</p>
    
    <p>Our mission is to help you create at the speed of thought. Get started by exploring our trending assets or completing your profile to receive personalized recommendations.</p>
    
    <center>
      <a href="${SITE_URL}/products" class="button">Explore the Marketplace</a>
    </center>
    
    <p style="margin-top: 32px;">To your success,<br/><strong>The Prontly Team</strong></p>
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
  
  const fromEmail = settings?.emailSettings?.fromEmail || 'support@prontly.in';
  const senderName = settings?.emailSettings?.senderName || 'Prontly Store';

  const html = emailWrapper(`
    <h1>Security Update.</h1>
    <p>A request was made to reset the password for your Prontly account. If you didn't initiate this, you can safely ignore this email.</p>
    
    <div class="card" style="text-align: center;">
      <p style="margin-bottom: 0;">Please follow the secure link sent by our authentication provider to finalize your new credentials. For your protection, this link is only valid for 60 minutes.</p>
    </div>
    
    <center>
      <a href="${SITE_URL}/dashboard" class="button">Visit Security Center</a>
    </center>
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
