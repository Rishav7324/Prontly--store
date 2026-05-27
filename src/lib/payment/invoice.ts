import { jsPDF } from 'jspdf';
import { formatPrice } from './gst';

/**
 * Generates a professional PDF invoice for digital asset purchases.
 * Handles both Javascript Dates and Firestore Timestamps.
 */
export async function generateInvoicePdf(order: any): Promise<string> {
  const doc = new jsPDF();
  const primaryColor = '#533afd'; // Deep Violet
  let y = 20;

  // Header Branding
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', 20, 25);
  
  doc.setFontSize(10);
  doc.text('PRONTLY DIGITAL STORE', 190, 25, { align: 'right' });

  // Robust Date Handling
  const orderDate = order.createdAt?.toDate 
    ? order.createdAt.toDate() 
    : (order.createdAt instanceof Date ? order.createdAt : new Date());

  // Order Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  y = 55;
  doc.text(`Invoice No: INV-${order.id.slice(-8).toUpperCase()}`, 20, y);
  y += 7;
  doc.text(`Date: ${orderDate.toLocaleDateString('en-IN')}`, 20, y);
  y += 7;
  doc.text(`Customer: ${order.userName || 'Verified Creator'}`, 20, y);
  y += 7;
  doc.text(`Email: ${order.userEmail}`, 20, y);

  // Table Header
  y += 15;
  doc.setFillColor(240, 240, 240);
  doc.rect(20, y, 170, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('Product Description', 25, y + 7);
  doc.text('Qty', 120, y + 7);
  doc.text('Amount', 185, y + 7, { align: 'right' });

  // Table Body
  y += 10;
  doc.setFont('helvetica', 'normal');
  for (const item of (order.items || [])) {
    y += 10;
    doc.text(item.productName, 25, y);
    doc.text(String(item.quantity || 1), 122, y);
    doc.text(formatPrice(item.price), 185, y, { align: 'right' });
    
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
  }

  // Totals Section
  y += 20;
  const startX = 130;
  doc.text('Subtotal:', startX, y);
  doc.text(formatPrice(order.subtotal || 0), 185, y, { align: 'right' });
  
  if (order.discountAmount > 0) {
    y += 8;
    doc.setTextColor(34, 197, 94);
    doc.text('Discount:', startX, y);
    doc.text(`-${formatPrice(order.discountAmount)}`, 185, y, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }

  y += 8;
  doc.text('GST (18%):', startX, y);
  doc.text(formatPrice(order.gstAmount || 0), 185, y, { align: 'right' });

  y += 12;
  doc.setLineWidth(0.5);
  doc.line(startX, y - 5, 190, y - 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(primaryColor);
  doc.text('Total Paid:', startX, y);
  doc.text(formatPrice(order.totalAmount || 0), 185, y, { align: 'right' });

  // Footer
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Digital product. No physical shipping. This is a computer generated document.', 105, 285, { align: 'center' });

  return doc.output('datauristring').split(',')[1];
}
