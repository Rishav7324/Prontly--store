'use server';

/**
 * @fileOverview High-level Email and Document Server Actions.
 */

import { sendEmail } from '@/services/email/service';
import { welcomeTemplate, invoiceTemplate } from '@/services/email/templates';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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
 * Generates a professional, branded PDF invoice.
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
    `INR ${(item.price / 100).toFixed(2)}`,
    `INR ${(item.price / 100).toFixed(2)}`
  ]);

  (doc as any).autoTable({
    startY: 90,
    head: [['Product Description', 'Qty', 'Unit Price', 'Total']],
    body: tableRows,
    headStyles: { fillColor: primaryColor },
    theme: 'striped'
  });

  const finalY = (doc as any).lastAutoTable.finalY || 150;

  // Totals
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Subtotal:`, 140, finalY + 20);
  doc.text(`INR ${(order.subtotal / 100).toFixed(2)}`, 190, finalY + 20, { align: 'right' });
  
  if (order.discount > 0) {
    doc.setTextColor(220, 38, 38);
    doc.text(`Discount:`, 140, finalY + 28);
    doc.text(`- INR ${(order.discount / 100).toFixed(2)}`, 190, finalY + 28, { align: 'right' });
  }

  doc.setTextColor(primaryColor);
  doc.setFontSize(16);
  doc.text(`Total Paid:`, 140, finalY + 40);
  doc.text(`INR ${(order.total / 100).toFixed(2)}`, 190, finalY + 40, { align: 'right' });

  // Footer
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text(settings?.invoiceSettings?.footerText || 'Thank you for your purchase. This is a computer generated document.', 105, 285, { align: 'center' });

  return doc.output('datauristring').split(',')[1];
}
