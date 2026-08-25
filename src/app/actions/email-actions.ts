'use server';

/**
 * @fileOverview High-level Email and Document Server Actions.
 */

import { sendEmail } from '@/services/email/service';
import {
  welcomeTemplate,
  invoiceTemplate,
  deliveryTemplate,
  refundTemplate,
  newOrderAlertTemplate,
} from '@/services/email/templates';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatPrice } from '@/lib/payment/gst';

/**
 * Dispatched immediately after account creation.
 */
export async function sendWelcomeEmail(to: string, name: string) {
  return sendEmail({
    type: 'marketing',
    to,
    subject: `🎉 Welcome to Prontly Store, ${name}!`,
    html: welcomeTemplate(name)
  });
}

/**
 * Dispatched after a successful payment verification.
 */
export async function sendOrderConfirmationEmail(order: any) {
  return sendEmail({
    type: 'order',
    to: order.userEmail,
    subject: `✅ Order Confirmed #${order.id.slice(-8).toUpperCase()} — Prontly Store`,
    html: invoiceTemplate(order)
  });
}

/**
 * Dispatched after fulfillment — download links ready.
 */
export async function sendDeliveryEmail(order: any) {
  return sendEmail({
    type: 'delivery',
    to: order.userEmail,
    subject: `📦 Your downloads are ready — Order #${order.id.slice(-8).toUpperCase()}`,
    html: deliveryTemplate(order)
  });
}

/**
 * Dispatched when an admin marks an order refunded.
 */
export async function sendRefundEmail(order: any) {
  return sendEmail({
    type: 'order',
    to: order.userEmail,
    subject: `↩️ Refund Processed — ₹${(((order.totalAmount ?? order.subtotal) || 0) / 100).toLocaleString('en-IN')} · Prontly Store`,
    html: refundTemplate(order)
  });
}

const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'orders@store.prontly.in';

/**
 * Internal alert to store owner on every paid order (best-effort, never blocks fulfillment).
 */
export async function sendNewOrderAlert(order: any) {
  try {
    await sendEmail({
      type: 'alert',
      to: ADMIN_ALERT_EMAIL,
      subject: `💰 New Order ₹${(((order.totalAmount ?? order.subtotal) || 0) / 100).toLocaleString('en-IN')} — ${order.userEmail}`,
      html: newOrderAlertTemplate(order)
    });
  } catch { /* never block checkout for alerts */ }
}

/**
 * Generates a professional, branded PDF invoice with GST breakdown.
 * Returns a base64 string for client-side download.
 */
export async function generateInvoicePdf(order: any, settings: any) {
  const doc = new jsPDF();
  const primaryColor = settings?.invoiceSettings?.color || '#5b52d6';
  const businessName = settings?.invoiceSettings?.businessName || 'PRONTLY DIGITAL';
  
  // Header Branding
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', 20, 25);
  
  doc.setFontSize(10);
  doc.text(businessName.toUpperCase(), 190, 25, { align: 'right' });

  // Order Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Invoice No: INV-${order.id.slice(-8).toUpperCase()}`, 20, 55);
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 20, 62);
  doc.text(`Customer: ${order.userName}`, 20, 69);
  doc.text(`Email: ${order.userEmail}`, 20, 76);

  // Table
  const tableRows = order.items.map((item: any) => [
    item.productName,
    '1',
    formatPrice(item.price),
    formatPrice(item.price)
  ]);

  (doc as any).autoTable({
    startY: 90,
    head: [['Product Description', 'Qty', 'Unit Price', 'Total']],
    body: tableRows,
    headStyles: { fillColor: primaryColor },
    theme: 'striped'
  });

  const finalY = (doc as any).lastAutoTable.finalY || 150;

  // Totals Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  let currentY = finalY + 15;

  doc.text(`Subtotal:`, 140, currentY);
  doc.text(formatPrice(order.subtotal), 190, currentY, { align: 'right' });
  
  if (order.discount > 0) {
    currentY += 8;
    doc.setTextColor(34, 197, 94);
    doc.text(`Discount:`, 140, currentY);
    doc.text(`- ${formatPrice(order.discount)}`, 190, currentY, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }

  // GST Row
  currentY += 8;
  doc.text(`GST (18%):`, 140, currentY);
  doc.text(formatPrice(order.gst || 0), 190, currentY, { align: 'right' });

  // Final Total
  currentY += 12;
  doc.setTextColor(primaryColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Paid:`, 140, currentY);
  doc.text(formatPrice(order.total), 190, currentY, { align: 'right' });

  // Footer
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(settings?.invoiceSettings?.footerText || 'Digital product. No physical shipping. This is a computer generated document.', 105, 285, { align: 'center' });

  return doc.output('datauristring').split(',')[1];
}
