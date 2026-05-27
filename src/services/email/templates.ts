/**
 * @fileOverview Premium branded HTML email templates for Prontly Store.
 * Designed for high deliverability and professional visual identity.
 */

const BRAND_COLOR = '#5b52d6';
const BG_COLOR = '#F8FAFC';
const CARD_BG = '#FFFFFF';
const TEXT_COLOR = '#1A1A2E';
const MUTED_TEXT = '#64748B';
const LOGO_URL = 'https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png';

/**
 * Base layout wrapper for all emails to ensure consistent branding across all senders.
 */
function baseLayout(content: string, previewText: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>Prontly Store</title>
  <style>
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; padding: 10px !important; }
      .card { border-radius: 16px !important; padding: 32px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BG_COLOR};font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;-webkit-font-smoothing:antialiased;">
  <span style="display:none;font-size:1px;color:${BG_COLOR};line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</span>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BG_COLOR};">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table class="container" width="600" cellpadding="0" cellspacing="0" border="0">
          <!-- Logo Section -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img src="${LOGO_URL}" alt="Prontly Logo" width="64" height="64" style="display:block; border-radius:16px; margin-bottom:12px;">
              <div style="font-size:18px;font-weight:bold;letter-spacing:1px;color:${TEXT_COLOR};">PRONTLY <span style="color:${BRAND_COLOR};">STORE</span></div>
            </td>
          </tr>
          <!-- Main Content Card -->
          <tr>
            <td class="card" style="background-color:${CARD_BG};border-radius:24px;padding:48px;box-shadow:0 10px 40px rgba(0,0,0,0.05);border:1px solid #E2E8F0;">
              ${content}
            </td>
          </tr>
          <!-- Professional Footer -->
          <tr>
            <td align="center" style="padding-top:32px;">
              <p style="margin:0;font-size:12px;color:${MUTED_TEXT};line-height:1.6;font-weight:500;">
                &copy; ${new Date().getFullYear()} Prontly Store. Built for modern creators.<br>
                This email was sent from a secure, verified system.
              </p>
              <div style="margin-top:16px;">
                <a href="https://store.prontly.in/privacy" style="color:${BRAND_COLOR};text-decoration:none;font-size:11px;font-weight:bold;margin:0 8px;text-transform:uppercase;letter-spacing:1px;">Privacy</a>
                <a href="https://store.prontly.in/terms" style="color:${BRAND_COLOR};text-decoration:none;font-size:11px;font-weight:bold;margin:0 8px;text-transform:uppercase;letter-spacing:1px;">Terms</a>
                <a href="https://store.prontly.in/delivery-policy" style="color:${BRAND_COLOR};text-decoration:none;font-size:11px;font-weight:bold;margin:0 8px;text-transform:uppercase;letter-spacing:1px;">Support</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function welcomeTemplate(name: string) {
  const content = `
    <h1 style="margin:0 0 16px;font-size:28px;font-weight:800;color:${TEXT_COLOR};text-align:center;">Welcome to the fold, ${name}! 🎉</h1>
    <p style="margin:0 0 24px;font-size:16px;color:${MUTED_TEXT};line-height:1.7;text-align:center;">You've joined a community of elite creators who demand high-performance digital assets.</p>
    <div style="background-color:#F1F5F9;border-radius:16px;padding:24px;margin-bottom:32px;border-left:4px solid ${BRAND_COLOR};">
      <p style="margin:0 0 8px;font-weight:bold;color:${TEXT_COLOR};font-size:14px;text-transform:uppercase;letter-spacing:1px;">Next Steps:</p>
      <ul style="margin:0;padding-left:20px;color:${MUTED_TEXT};font-size:14px;line-height:1.8;">
        <li>Browse our curated AI prompt engineering guides</li>
        <li>Access your instant downloads in the Dashboard</li>
        <li>Stay tuned for exclusive subscriber-only product drops</li>
      </ul>
    </div>
    <div align="center">
      <a href="https://store.prontly.in/products" style="background-color:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:14px;font-weight:bold;display:inline-block;box-shadow:0 10px 30px rgba(91,82,214,0.3);">Browse Digital Inventory</a>
    </div>
  `;
  return baseLayout(content, `Welcome to Prontly Store, ${name}! Your journey begins.`);
}

export function otpTemplate(otp: string, name: string) {
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:${TEXT_COLOR};text-align:center;">Security Verification</h1>
    <p style="margin:0 0 32px;font-size:15px;color:${MUTED_TEXT};line-height:1.6;text-align:center;">Hi ${name}, use the secure verification code below to authorize your account recovery request.</p>
    <div align="center" style="margin-bottom:32px;">
      <div style="background-color:#F1F5F9;border:2px solid ${BRAND_COLOR};border-radius:20px;padding:24px 40px;display:inline-block;">
        <span style="font-size:48px;font-weight:900;letter-spacing:12px;color:${BRAND_COLOR};font-family:'Courier New', Courier, monospace;">${otp}</span>
      </div>
    </div>
    <div style="background-color:#FFF7ED;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:12px;color:#9A3412;text-align:center;line-height:1.6;font-weight:500;">
        <strong>Security Notice:</strong> This code will expire in 10 minutes. If you did not request this reset, please change your password immediately or contact our security team at security@store.prontly.in.
      </p>
    </div>
  `;
  return baseLayout(content, `${otp} is your Prontly Store security code.`);
}

export function invoiceTemplate(data: any) {
  const itemsHtml = data.items.map((item: any) => `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid #F1F5F9;">
        <div style="font-weight:bold;color:${TEXT_COLOR};font-size:15px;">${item.productName}</div>
        <div style="font-size:11px;color:${MUTED_TEXT};text-transform:uppercase;margin-top:4px;letter-spacing:1px;font-weight:600;">Perpetual Digital License</div>
      </td>
      <td align="right" style="padding:16px 0;border-bottom:1px solid #F1F5F9;font-weight:bold;color:${TEXT_COLOR};font-size:15px;">
        ₹${(item.price / 100).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('');

  const content = `
    <div style="border-bottom:1px solid #F1F5F9;padding-bottom:24px;margin-bottom:24px;">
      <table width="100%">
        <tr>
          <td>
            <h1 style="margin:0;font-size:22px;font-weight:800;color:${TEXT_COLOR};">Order Confirmed</h1>
            <p style="margin:4px 0 0;font-size:12px;color:${MUTED_TEXT};font-weight:600;">TRANS ID: ${data.id.slice(-8).toUpperCase()}</p>
          </td>
          <td align="right">
            <div style="background-color:#ECFDF5;color:#059669;font-size:11px;font-weight:800;padding:6px 16px;border-radius:30px;display:inline-block;text-transform:uppercase;letter-spacing:1px;">Payment Verified</div>
          </td>
        </tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${itemsHtml}
    </table>
    <table width="100%" style="margin-bottom:32px;">
      <tr>
        <td align="right" style="color:${MUTED_TEXT};font-size:14px;padding-bottom:8px;font-weight:500;">Gross Subtotal</td>
        <td align="right" width="120" style="color:${TEXT_COLOR};font-size:14px;font-weight:bold;padding-bottom:8px;">₹${(data.subtotal / 100).toLocaleString('en-IN')}</td>
      </tr>
      ${data.discount > 0 ? `
      <tr>
        <td align="right" style="color:#059669;font-size:14px;padding-bottom:8px;font-weight:600;">Promotional Discount</td>
        <td align="right" style="color:#059669;font-size:14px;font-weight:bold;padding-bottom:8px;">-₹${(data.discount / 100).toLocaleString('en-IN')}</td>
      </tr>` : ''}
      <tr>
        <td align="right" style="font-size:20px;font-weight:800;color:${TEXT_COLOR};border-top:2px solid ${BRAND_COLOR};padding-top:16px;">Net Total Paid</td>
        <td align="right" style="font-size:20px;font-weight:800;color:${BRAND_COLOR};border-top:2px solid ${BRAND_COLOR};padding-top:16px;">₹${(data.subtotal / 100).toLocaleString('en-IN')}</td>
      </tr>
    </table>
    <div align="center">
      <a href="https://store.prontly.in/dashboard" style="background-color:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:18px 40px;border-radius:16px;font-weight:bold;display:inline-block;box-shadow:0 10px 30px rgba(91,82,214,0.3);">Access Your Library</a>
    </div>
  `;
  return baseLayout(content, `Success! Your order #${data.id.slice(-8).toUpperCase()} has been fulfilled.`);
}
