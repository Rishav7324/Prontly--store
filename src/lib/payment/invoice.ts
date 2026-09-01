import { jsPDF } from 'jspdf';
import { formatPrice } from './gst';

/**
 * @fileOverview Ultra-Premium PDF Tax Invoice & Proof of Purchase Generator.
 * Supports custom background images, luxury watermarks, and high-contrast vector styling.
 */
export async function generateInvoicePdf(order: any, options?: { bgImageBase64?: string; watermark?: boolean }): Promise<string> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;

  // 1. Base White Canvas
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // 2. Custom Background Image if provided (full-page or header)
  const bgImg = options?.bgImageBase64 || order?.bgImageBase64 || order?.invoiceBg;
  if (bgImg && typeof bgImg === 'string' && bgImg.startsWith('data:image')) {
    try {
      doc.addImage(bgImg, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
      // Subtle semi-transparent white overlay to ensure text readability
      doc.setFillColor(255, 255, 255);
      doc.setGState(new (doc as any).GState({ opacity: 0.88 }));
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
    } catch (e) {
      console.warn('[PDF] Could not draw custom background image:', e);
    }
  }

  // 3. Subtle Luxury Watermark in Center (8% opacity geometric brand stamp)
  try {
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.75);
    // Outer decorative octagon / concentric watermark
    doc.circle(pageWidth / 2, 145, 48, 'S');
    doc.circle(pageWidth / 2, 145, 42, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(241, 245, 249);
    doc.text('PRONTLY VERIFIED', pageWidth / 2, 147, { align: 'center' });
  } catch (_e) {}

  // 4. Header Luxury Dark Texture Block
  doc.setFillColor(9, 9, 11);
  doc.rect(0, 0, pageWidth, 48, 'F');

  // Decorative luxury diagonal lines in header for premium feel
  doc.setDrawColor(24, 24, 27);
  doc.setLineWidth(0.3);
  for (let i = -20; i < pageWidth + 50; i += 8) {
    doc.line(i, 0, i + 30, 48);
  }

  // 5. Gold Accent Trim Line under header
  doc.setFillColor(217, 119, 6); // amber-600
  doc.rect(0, 48, pageWidth, 2.5, 'F');

  // Header Title & Verification
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('TAX INVOICE', 20, 24);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(245, 158, 11); // gold
  doc.text('OFFICIAL PROOF OF PURCHASE', 20, 32);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PRONTLY DIGITAL STORE', pageWidth - 20, 22, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('store.prontly.in • contact@prontly.in', pageWidth - 20, 28, { align: 'right' });
  doc.text('GSTIN: VERIFIED DIGITAL SUPPLIER (INDIA)', pageWidth - 20, 34, { align: 'right' });

  // Date & Transaction Metadata Box
  const orderDate = order.createdAt?.toDate 
    ? order.createdAt.toDate() 
    : (order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt || Date.now()));

  const formattedDate = orderDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const orderRef = `#${(order.id || '').slice(-8).toUpperCase()}`;

  let y = 64;

  // Metadata Card Container
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, y, pageWidth - 40, 32, 3, 3, 'FD');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('INVOICE / ORDER NO', 28, y + 10);
  doc.text('DATE & TIME', 85, y + 10);
  doc.text('BILLED TO (CUSTOMER)', 140, y + 10);

  doc.setFontSize(10);
  doc.setTextColor(9, 9, 11);
  doc.text(orderRef, 28, y + 18);
  doc.text(formattedDate, 85, y + 18);
  doc.text(order.userEmail || order.userName || 'Verified Customer', 140, y + 18);

  // Status Badge inside Card
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(28, y + 22, 28, 6, 1.5, 1.5, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text('● PAID / SETTLED', 42, y + 26.2, { align: 'center' });

  // Table Header
  y += 44;
  doc.setFillColor(9, 9, 11);
  doc.rect(20, y, pageWidth - 40, 9, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('ITEM DESCRIPTION', 26, y + 6);
  doc.text('LICENSE TYPE', 115, y + 6);
  doc.text('QTY', 150, y + 6, { align: 'center' });
  doc.text('AMOUNT (INR)', pageWidth - 26, y + 6, { align: 'right' });

  // Table Rows
  y += 9;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);

  const items = order.items || [];
  items.forEach((item: any, index: number) => {
    const isEven = index % 2 === 0;
    if (isEven) {
      doc.setFillColor(248, 250, 252);
      doc.rect(20, y, pageWidth - 40, 11, 'F');
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(20, y + 11, pageWidth - 20, y + 11);

    doc.setTextColor(9, 9, 11);
    doc.setFont('helvetica', 'bold');
    doc.text(item.productName || 'Digital Asset', 26, y + 7.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text('PERPETUAL COMMERCIAL', 115, y + 7.5);

    doc.setFontSize(9);
    doc.setTextColor(9, 9, 11);
    doc.text(`${item.quantity || 1}`, 150, y + 7.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.text(formatPrice(item.price || 0), pageWidth - 26, y + 7.5, { align: 'right' });

    y += 11;
  });

  // Financial Totals Summary Box
  y += 15;
  const summaryX = 115;
  const summaryWidth = pageWidth - 20 - summaryX;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', summaryX, y);
  doc.setTextColor(9, 9, 11);
  doc.text(formatPrice(order.subtotal || 0), pageWidth - 26, y, { align: 'right' });

  if (order.discountAmount > 0) {
    y += 7;
    doc.setTextColor(5, 150, 105);
    doc.text(`Coupon Savings (${order.couponCode || 'PROMO'}):`, summaryX, y);
    doc.text(`-${formatPrice(order.discountAmount)}`, pageWidth - 26, y, { align: 'right' });
  }

  y += 10;
  // Total Paid Accent Box
  doc.setFillColor(9, 9, 11);
  doc.roundedRect(summaryX - 4, y - 5, summaryWidth + 4, 12, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL PAID:', summaryX + 2, y + 3);
  doc.setTextColor(251, 191, 36); // Amber / Gold
  doc.text(formatPrice(order.totalAmount || order.total || order.subtotal || 0), pageWidth - 26, y + 3, { align: 'right' });

  // Official Verified Stamp Seal
  const footerY = 240;
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.75);
  doc.circle(42, footerY + 8, 14, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text('PRONTLY', 42, footerY + 6, { align: 'center' });
  doc.text('VERIFIED', 42, footerY + 11, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Electronically generated and cryptographically indexed tax invoice.', 65, footerY + 6);
  doc.text('All digital goods and licenses are fulfilled immediately upon confirmation.', 65, footerY + 11);
  doc.text('Permanent download records are safely held in your Customer Vault.', 65, footerY + 16);

  // Bottom Footer Bar
  doc.setFillColor(241, 245, 249);
  doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('© 2026 Prontly Store • Digital Assets Marketplace • support@store.prontly.in', pageWidth / 2, pageHeight - 6, { align: 'center' });

  return doc.output('datauristring').split(',')[1];
}
