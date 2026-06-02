import { jsPDF } from 'jspdf';
import { formatPrice } from './gst';

/**
 * @fileOverview Premium PDF Receipt Generator.
 * Creates branded, high-contrast receipts for digital asset acquisitions.
 */
export async function generateInvoicePdf(order: any): Promise<string> {
  const doc = new jsPDF();
  const primaryColor = '#111827'; // Midnight Ink
  const accentColor = '#3B82F6';  // Electric Blue
  let y = 20;

  // Header Branding
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, 210, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIPT', 20, 28);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('PRONTLY DIGITAL STORE', 190, 20, { align: 'right' });
  doc.text('store.prontly.in', 190, 26, { align: 'right' });
  doc.setFontSize(8);
  doc.text('Verified Digital Assets Ecosystem', 190, 32, { align: 'right' });

  // Robust Date Handling
  const orderDate = order.createdAt?.toDate 
    ? order.createdAt.toDate() 
    : (order.createdAt instanceof Date ? order.createdAt : new Date());

  // Transaction Ledger Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  y = 65;
  
  doc.setFont('helvetica', 'bold');
  doc.text('TRANSACTION LEDGER', 20, y);
  doc.setDrawColor(226, 232, 240); // #E2E8F0
  doc.line(20, y + 2, 190, y + 2);
  
  y += 12;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text('Reference No:', 20, y);
  doc.text('Date:', 20, y + 7);
  doc.text('Account:', 20, y + 14);
  
  doc.setTextColor(17, 24, 39); // Navy 900
  doc.setFont('helvetica', 'bold');
  doc.text(`REF-${order.id.slice(-8).toUpperCase()}`, 60, y);
  doc.text(orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }), 60, y + 7);
  doc.text(order.userEmail || 'Verified Creator', 60, y + 14);

  // Table Structure
  y += 30;
  doc.setFillColor(248, 250, 252); // #F8FAFC
  doc.rect(20, y, 170, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('ITEMIZED ASSETS', 25, y + 6.5);
  doc.text('LICENSE', 120, y + 6.5);
  doc.text('VALUE', 185, y + 6.5, { align: 'right' });

  // Table Content
  y += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  for (const item of (order.items || [])) {
    y += 12;
    doc.setTextColor(17, 24, 39);
    doc.text(item.productName, 25, y);
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text('PERPETUAL', 120, y);
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(formatPrice(item.price), 185, y, { align: 'right' });
    
    // Page break protection
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
  }

  // Financial Recap Section
  y += 30;
  const startX = 130;
  doc.setDrawColor(241, 245, 249);
  doc.line(startX, y - 8, 190, y - 8);
  
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Gross Subtotal:', startX, y);
  doc.setTextColor(17, 24, 39);
  doc.text(formatPrice(order.subtotal || 0), 185, y, { align: 'right' });
  
  if (order.discountAmount > 0) {
    y += 8;
    doc.setTextColor(16, 185, 129); // Emerald 500
    doc.text(`Promo Incentive (${order.couponCode || 'DISCOUNT'}):`, startX, y);
    doc.text(`-${formatPrice(order.discountAmount)}`, 185, y, { align: 'right' });
  }

  y += 15;
  doc.setFillColor(primaryColor);
  doc.rect(startX - 5, y - 6, 65, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL PAID:', startX, y + 2);
  doc.text(formatPrice(order.totalAmount || order.total || 0), 185, y + 2, { align: 'right' });

  // Legal Footer
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Digital asset licensing is fulfilled instantly upon payment verification.', 105, 275, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('This is an electronically generated receipt and does not require a physical signature.', 105, 282, { align: 'center' });
  doc.text('© Prontly Store • Digital Acquisition Ecosystem', 105, 289, { align: 'center' });

  return doc.output('datauristring').split(',')[1];
}

