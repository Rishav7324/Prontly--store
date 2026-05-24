/**
 * @fileOverview Premium branded HTML email templates.
 */

const BRAND_COLOR = '#5b52d6';
const BG_COLOR = '#F8FAFC';
const CARD_BG = '#FFFFFF';
const TEXT_COLOR = '#1A1A2E';
const MUTED_TEXT = '#64748B';

/**
 * Base layout wrapper for all emails to ensure consistent branding.
 */
function baseLayout(content: string, previewText: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Prontly Store</title>
  <style>
    @media only screen and (max-width: 620px) {
      .container { width: 100% !important; padding: 10px !important; }
      .card { border-radius: 16px !important; padding: 24px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BG_COLOR};font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <span style="display:none;font-size:1px;color:${BG_COLOR};line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</span>
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BG_COLOR};">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table class="container" width="600" cellpadding="0" cellspacing="0" border="0">
          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="background-color:${BRAND_COLOR};width:48px;height:48px;border-radius:12px;display:inline-block;text-align:center;line-height:48px;color:#ffffff;font-size:24px;font-weight:bold;">P</div>
              <div style="margin-top:12px;font-size:18px;font-weight:bold;letter-spacing:1px;color:${TEXT_COLOR};">PRONTLY <span style="color:${BRAND_COLOR};">STORE</span></div>
            </td>
          </tr>
          <!-- Main Card -->
          <tr>
            <td class="card" style="background-color:${CARD_BG};border-radius:24px;padding:48px;box-shadow:0 10px 40px rgba(0,0,0,0.05);border:1px solid #E2E8F0;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:32px;">
              <p style="margin:0;font-size:12px;color:${MUTED_TEXT};line-height:1.6;">
                &copy; ${new Date().getFullYear()} Prontly Store. All rights reserved.<br>
                Patna, Bihar, India. Digital Goods Division.
              </p>
              <div style="margin-top:16px;">
                <a href="https://store.prontly.in/privacy" style="color:${BRAND_COLOR};text-decoration:none;font-size:11px;font-weight:bold;margin:0 8px;">PRIVACY</a>
                <a href="https://store.prontly.in/terms" style="color:${BRAND_COLOR};text-decoration:none;font-size:11px;font-weight:bold;margin:0 8px;">TERMS</a>
                <a href="https://store.prontly.in/support" style="color:${BRAND_COLOR};text-decoration:none;font-size:11px;font-weight:bold;margin:0 8px;">SUPPORT</a>
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
    <h1 style="margin:0 0 16px;font-size:28px;font-weight:800;color:${TEXT_COLOR};text-align:center;">Welcome, ${name}! 🎉</h1>
    <p style="margin:0 0 24px;font-size:16px;color:${MUTED_TEXT};line-height:1.7;text-align:center;">We're thrilled to have you in the Prontly creator community. Your access to premium AI prompts and digital assets is now active.</p>
    <div style="background-color:#F1F5F9;border-radius:16px;padding:24px;margin-bottom:32px;border-left:4px solid ${BRAND_COLOR};">
      <p style="margin:0 0 8px;font-weight:bold;color:${TEXT_COLOR};font-size:14px;">GETTING STARTED:</p>
      <ul style="margin:0;padding-left:20px;color:${MUTED_TEXT};font-size:14px;line-height:1.6;">
        <li>Browse our curated marketplace</li>
        <li>Access instant downloads in your dashboard</li>
        <li>Receive lifetime updates on purchased assets</li>
      </ul>
    </div>
    <div align="center">
      <a href="https://store.prontly.in/products" style="background-color:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:14px;font-weight:bold;display:inline-block;box-shadow:0 10px 20px rgba(91,82,214,0.2);">Explore Marketplace</a>
    </div>
  `;
  return baseLayout(content, `Welcome to Prontly Store, ${name}!`);
}

export function otpTemplate(otp: string, name: string) {
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:${TEXT_COLOR};text-align:center;">Security Verification</h1>
    <p style="margin:0 0 32px;font-size:15px;color:${MUTED_TEXT};line-height:1.6;text-align:center;">Hi ${name}, use the 6-digit code below to securely verify your identity and reset your account password.</p>
    <div align="center" style="margin-bottom:32px;">
      <div style="background-color:#F1F5F9;border:2px solid ${BRAND_COLOR};border-radius:16px;padding:24px;display:inline-block;">
        <span style="font-size:42px;font-weight:900;letter-spacing:12px;color:${BRAND_COLOR};font-family:monospace;">${otp}</span>
      </div>
    </div>
    <p style="margin:0;font-size:12px;color:#94A3B8;text-align:center;line-height:1.6;">
      This code will expire in <strong>10 minutes</strong>.<br>
      If you didn't request this, please ignore this email or contact support.
    </p>
  `;
  return baseLayout(content, `${otp} is your Prontly Store security code`);
}

export function invoiceTemplate(data: any) {
  const itemsHtml = data.items.map((item: any) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #F1F5F9;">
        <div style="font-weight:bold;color:${TEXT_COLOR};font-size:14px;">${item.productName}</div>
        <div style="font-size:11px;color:${MUTED_TEXT};text-transform:uppercase;margin-top:2px;">Digital License</div>
      </td>
      <td align="right" style="padding:12px 0;border-bottom:1px solid #F1F5F9;font-weight:bold;color:${TEXT_COLOR};font-size:14px;">
        ₹${(item.price / 100).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('');

  const content = `
    <div style="border-bottom:1px solid #F1F5F9;padding-bottom:24px;margin-bottom:24px;">
      <table width="100%">
        <tr>
          <td>
            <h1 style="margin:0;font-size:20px;font-weight:800;color:${TEXT_COLOR};">Order Confirmed</h1>
            <p style="margin:4px 0 0;font-size:12px;color:${MUTED_TEXT};">Invoice #${data.id.slice(-8).toUpperCase()}</p>
          </td>
          <td align="right">
            <div style="background-color:#ECFDF5;color:#10B981;font-size:10px;font-weight:bold;padding:4px 12px;border-radius:20px;display:inline-block;text-transform:uppercase;">Paid</div>
          </td>
        </tr>
      </table>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${itemsHtml}
    </table>
    <table width="100%" style="margin-bottom:32px;">
      <tr>
        <td align="right" style="color:${MUTED_TEXT};font-size:14px;padding-bottom:8px;">Subtotal</td>
        <td align="right" width="100" style="color:${TEXT_COLOR};font-size:14px;font-weight:bold;padding-bottom:8px;">₹${(data.subtotal / 100).toLocaleString('en-IN')}</td>
      </tr>
      ${data.discount > 0 ? `
      <tr>
        <td align="right" style="color:#10B981;font-size:14px;padding-bottom:8px;">Discount</td>
        <td align="right" style="color:#10B981;font-size:14px;font-weight:bold;padding-bottom:8px;">-₹${(data.discount / 100).toLocaleString('en-IN')}</td>
      </tr>` : ''}
      <tr>
        <td align="right" style="font-size:18px;font-weight:800;color:${TEXT_COLOR};border-top:2px solid ${BRAND_COLOR};padding-top:16px;">Total Paid</td>
        <td align="right" style="font-size:18px;font-weight:800;color:${BRAND_COLOR};border-top:2px solid ${BRAND_COLOR};padding-top:16px;">₹${(data.total / 100).toLocaleString('en-IN')}</td>
      </tr>
    </table>
    <div align="center">
      <a href="https://store.prontly.in/dashboard" style="background-color:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:bold;display:inline-block;">Access Your Downloads</a>
    </div>
  `;
  return baseLayout(content, `Success! Your Prontly order #${data.id.slice(-8).toUpperCase()} is verified.`);
}
