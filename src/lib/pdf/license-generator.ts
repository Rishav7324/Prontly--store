import { jsPDF } from 'jspdf';

interface LicenseCertificateProps {
  licenseId: string;
  productName: string;
  licenseeEmail: string;
  licenseeName?: string;
  orderId: string;
  purchaseDate: string | Date;
  fileVersion?: string;
}

/**
 * Generates an official, high-resolution Branded Commercial License Certificate (PDF).
 */
export async function generateLicenseCertificatePdf({
  licenseId,
  productName,
  licenseeEmail,
  licenseeName,
  orderId,
  purchaseDate,
  fileVersion = '1.0',
}: LicenseCertificateProps): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const primaryNavy = '#09090b';
  const goldAccent = '#d97706';
  const slateText = '#475569';

  // 1. Elegant Certificate Border & Background Frame
  doc.setFillColor(252, 252, 253);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Outer Border
  doc.setDrawColor(217, 119, 6); // Gold Accent
  doc.setLineWidth(1.5);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // Inner Thin Border
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

  // Header Ornamental Bar
  doc.setFillColor(9, 9, 11);
  doc.rect(15, 15, pageWidth - 30, 22, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('PRONTLY DIGITAL STORE', 25, 29);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(217, 119, 6);
  doc.text('OFFICIAL VERIFIED CERTIFICATE', pageWidth - 25, 29, { align: 'right' });

  // Main Title
  doc.setTextColor(9, 9, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('CERTIFICATE OF COMMERCIAL LICENSE', pageWidth / 2, 54, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text('PERPETUAL DIGITAL ASSET USAGE GRANT', pageWidth / 2, 62, { align: 'center' });

  // Decorative Divider
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.75);
  doc.line(pageWidth / 2 - 40, 67, pageWidth / 2 + 40, 67);

  // Licensee Grant Statement
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(11);
  doc.text('This document certifies that perpetual, worldwide commercial usage rights for the digital asset:', pageWidth / 2, 78, { align: 'center' });

  // Asset Name Highlight
  doc.setTextColor(9, 9, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(`"${productName}" (v${fileVersion})`, pageWidth / 2, 90, { align: 'center' });

  // Licensee Name & Email
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text('have been legitimately granted to the verified purchaser:', pageWidth / 2, 100, { align: 'center' });

  doc.setTextColor(217, 119, 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(licenseeName || licenseeEmail, pageWidth / 2, 109, { align: 'center' });

  if (licenseeName && licenseeEmail) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`(${licenseeEmail})`, pageWidth / 2, 116, { align: 'center' });
  }

  // Two-Column Metadata Box
  const boxY = 126;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(25, boxY, pageWidth - 50, 36, 4, 4, 'FD');

  const formattedDate = purchaseDate instanceof Date 
    ? purchaseDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date(purchaseDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('LICENSE IDENTIFIER', 35, boxY + 10);
  doc.text('ORDER REFERENCE', 105, boxY + 10);
  doc.text('ISSUANCE DATE', 175, boxY + 10);
  doc.text('LICENSE SCOPE', 235, boxY + 10);

  doc.setFontSize(10);
  doc.setTextColor(9, 9, 11);
  doc.text(licenseId.toUpperCase(), 35, boxY + 18);
  doc.text(orderId ? `REF-${orderId.slice(-8).toUpperCase()}` : 'INSTANT-VAULT', 105, boxY + 18);
  doc.text(formattedDate, 175, boxY + 18);
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text('COMMERCIAL (TIER-1)', 235, boxY + 18);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Unlimited Personal, Client & Commercial Production Works • No Royalty Surcharges', 35, boxY + 28);

  // Bottom Sign-off and Verification Seal
  const footerY = 176;

  // Verification Seal
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.5);
  doc.circle(50, footerY + 6, 12, 'FD');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text('PRONTLY', 50, footerY + 5, { align: 'center' });
  doc.text('VERIFIED', 50, footerY + 9, { align: 'center' });

  // Verification Text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Issued by Prontly Store Digital Infrastructure. Cryptographically indexed and stored in Neon Ledger.', 70, footerY + 5);
  doc.text('Direct redistribution or resale of raw source files is strictly prohibited under terms of service.', 70, footerY + 10);

  // Digital Signature
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(9, 9, 11);
  doc.text('Prontly Licensing Authority', pageWidth - 35, footerY + 5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Official Digital Seal & Grant', pageWidth - 35, footerY + 10, { align: 'right' });

  // Save the PDF file
  const cleanFilename = productName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  doc.save(`Prontly_License_${cleanFilename}.pdf`);
}
