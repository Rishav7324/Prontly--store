/**
 * @fileOverview Ultra-Premium Branded HTML Email Templates for Prontly Store.
 * Modern Stripe & Apple-grade aesthetic (Inter typography, crisp cards, subtle glows, luxury accents).
 */

const BRAND = '#2563eb';       // Electric Blue
const BRAND_DARK = '#1d4ed8';
const INK = '#09090b';         // Deep Zinc 950
const INK_SOFT = '#27272a';    // Zinc 800
const SOFT = '#52525b';        // Zinc 600
const MUTED = '#71717a';       // Zinc 500
const LINE = '#e4e4e7';        // Zinc 200
const BG = '#f4f4f5';          // Zinc 100
const CARD = '#ffffff';
const GREEN = '#10b981';       // Emerald 500
const GOLD = '#f59e0b';        // Amber 500
const LOGO_URL = 'https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png';
const SITE = 'https://store.prontly.in';

function btn(url: string, label: string, gold?: boolean) {
  const bg = gold ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #09090b 0%, #27272a 100%)';
  const shadow = gold ? '0 10px 25px -5px rgba(245,158,11,0.4)' : '0 10px 25px -5px rgba(0,0,0,0.3)';
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto;width:100%;max-width:320px;">
    <tr>
      <td align="center" style="border-radius:12px;background:${bg};box-shadow:${shadow};">
        <a href="${url}" target="_blank" style="display:block;padding:14px 28px;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.02em;text-decoration:none;text-align:center;border-radius:12px;">
          ${label} &rarr;
        </a>
      </td>
    </tr>
  </table>`;
}

/** Base layout wrapper — luxury canvas, consistent headers and verified footers. */
function baseLayout(content: string, previewText: string, darkHeader = false) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="x-apple-disable-message-reformatting">
<title>Prontly Store</title>
<style>
  body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
  img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
  @media only screen and (max-width:600px) {
    .container { width: 100% !important; }
    .card-padding { padding: 24px 20px !important; }
    .header-logo { width: 32px !important; height: 32px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<span style="display:none;font-size:1px;color:${BG};line-height:1px;max-height:0;overflow:hidden;mso-hide:all;">${previewText}</span>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BG};">
  <tr>
    <td align="center" style="padding:40px 16px;">
      
      <table class="container" width="580" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;width:100%;">
        
        <!-- Brand Header Bar -->
        <tr>
          <td align="center" style="padding-bottom:24px;">
            <a href="${SITE}" target="_blank" style="text-decoration:none;display:inline-block;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" valign="middle">
                    <img src="${LOGO_URL}" alt="Prontly" width="38" height="38" class="header-logo" style="display:block;border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,0.12);margin-bottom:8px;">
                  </td>
                </tr>
                <tr>
                  <td align="center" valign="middle">
                    <span style="font-size:15px;font-weight:800;color:${INK};letter-spacing:-0.02em;">PRONTLY <span style="color:${BRAND};font-weight:700;">STORE</span></span>
                  </td>
                </tr>
              </table>
            </a>
          </td>
        </tr>

        <!-- Main Card Container -->
        <tr>
          <td class="card-padding" style="background-color:${CARD};border-radius:20px;padding:36px 32px;border:1px solid ${LINE};box-shadow:0 12px 32px -4px rgba(0,0,0,0.06);">
            ${content}
          </td>
        </tr>

        <!-- Trust & Security Footer -->
        <tr>
          <td align="center" style="padding-top:28px;">
            <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
              <tr>
                <td align="center" style="font-size:11px;font-weight:600;color:${MUTED};">
                  🔒 256-bit Encrypted Transaction &bull; Instant Cloudflare Delivery &bull; Verified Digital Assets
                </td>
              </tr>
            </table>
            
            <p style="margin:0 0 8px;font-size:12px;color:${MUTED};line-height:1.6;">
              &copy; ${year} Prontly Technologies &middot; 
              <a href="${SITE}/dashboard/downloads" style="color:${INK};text-decoration:none;font-weight:600;">My Vault</a> &middot;
              <a href="${SITE}/privacy" style="color:${MUTED};text-decoration:none;">Privacy</a> &middot; 
              <a href="${SITE}/terms" style="color:${MUTED};text-decoration:none;">Terms</a> &middot; 
              <a href="${SITE}/contact" style="color:${MUTED};text-decoration:none;">Support</a>
            </p>
            <p style="margin:0;font-size:11px;color:#a1a1aa;">
              Official communications from store.prontly.in for verified creators.
            </p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>`;
}

function row(label: string, value: string, opts?: { strong?: boolean; green?: boolean; mono?: boolean }) {
  const color = opts?.green ? GREEN : opts?.strong ? INK : SOFT;
  const weight = opts?.strong ? '700' : '500';
  const family = opts?.mono ? "'JetBrains Mono',SFMono-Regular,Consolas,monospace" : 'inherit';
  return `<tr>
    <td style="padding:11px 0;border-bottom:1px solid ${LINE};font-size:12px;color:${SOFT};font-weight:500;">${label}</td>
    <td align="right" style="padding:11px 0;border-bottom:1px solid ${LINE};font-size:12px;color:${color};font-weight:${weight};font-family:${family};">${value}</td>
  </tr>`;
}

/* ─────────────────────────── 1. WELCOME EMAIL ─────────────────────────── */
export function welcomeTemplate(name: string) {
  const content = `
  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-block;background:rgba(37,99,235,0.08);border:1px solid rgba(37,99,235,0.2);color:${BRAND};font-size:10px;font-weight:800;letter-spacing:0.1em;padding:4px 12px;border-radius:20px;text-transform:uppercase;margin-bottom:12px;">
      CREATOR MEMBERSHIP ACTIVE
    </div>
    <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:${INK};letter-spacing:-0.02em;line-height:1.2;">
      Welcome to the future of high-speed creation, ${name}! 🚀
    </h1>
    <p style="margin:0;font-size:13px;color:${SOFT};line-height:1.6;max-width:440px;margin:0 auto;">
      Your Prontly account gives you instant access to production-ready AI prompt architectures, design systems, and developer workflows.
    </p>
  </div>

  <div style="background:${BG};border:1px solid ${LINE};border-radius:14px;padding:20px;margin-bottom:24px;">
    <p style="margin:0 0 12px;font-weight:800;color:${INK};font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">
      What's included in your workspace:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td valign="top" style="padding-bottom:10px;font-size:12px;color:${SOFT};line-height:1.6;">
          <strong style="color:${INK};">⚡ Instant Cloud Delivery:</strong> Download source files with high-speed Cloudflare R2 links.
        </td>
      </tr>
      <tr>
        <td valign="top" style="padding-bottom:10px;font-size:12px;color:${SOFT};line-height:1.6;">
          <strong style="color:${INK};">📜 Perpetual Commercial License:</strong> Use purchased assets in unlimited client & SaaS builds.
        </td>
      </tr>
      <tr>
        <td valign="top" style="font-size:12px;color:${SOFT};line-height:1.6;">
          <strong style="color:${INK};">🔄 Lifetime Version Updates:</strong> Access all future patches and upgrades free forever.
        </td>
      </tr>
    </table>
  </div>

  ${btn(`${SITE}/products`, 'Explore Asset Marketplace')}
  
  <p style="margin:0;text-align:center;font-size:11px;color:${MUTED};">
    Questions or custom requests? Simply reply to this email to reach our team directly.
  </p>`;

  return baseLayout(content, `Welcome to Prontly Store, ${name}! Your creator account is ready.`);
}

/* ─────────────────────────── 2. OTP / SECURITY CODE ─────────────────────────── */
export function otpTemplate(otp: string, name: string) {
  const content = `
  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-block;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);color:#b45309;font-size:10px;font-weight:800;letter-spacing:0.1em;padding:4px 12px;border-radius:20px;text-transform:uppercase;margin-bottom:12px;">
      ACCOUNT VERIFICATION
    </div>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${INK};letter-spacing:-0.02em;">
      Your Security Code
    </h1>
    <p style="margin:0;font-size:13px;color:${SOFT};line-height:1.6;">
      Hi ${name}, enter this single-use code to verify your identity and reset your password.
    </p>
  </div>

  <div align="center" style="margin:28px 0;">
    <div style="background:linear-gradient(180deg, #fafafa 0%, #f4f4f5 100%);border:2px dashed #cbd5e1;border-radius:16px;padding:20px 36px;display:inline-block;box-shadow:inset 0 2px 4px rgba(0,0,0,0.02);">
      <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:${INK};font-family:'JetBrains Mono',SFMono-Regular,Consolas,monospace;">${otp}</span>
    </div>
  </div>

  <div style="background:#fffbeb;border:1px solid #fef3c7;border-radius:12px;padding:14px;margin-bottom:20px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#92400e;line-height:1.6;">
      ⚠️ <strong>Security Notice:</strong> This code expires in <strong>10 minutes</strong> and can only be used once. If you did not request this code, your account remains secure — please ignore this email.
    </p>
  </div>`;

  return baseLayout(content, `${otp} is your Prontly security verification code.`);
}

/* ─────────────────────────── 3. ORDER INVOICE & RECEIPT ─────────────────────────── */
export function invoiceTemplate(data: any) {
  const orderDate = data.createdAt 
    ? new Date(data.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) 
    : 'Today';
  const orderIdShort = (data.id || '').slice(-8).toUpperCase();
  const totalPaid = (((data.totalAmount ?? data.subtotal) || 0) / 100).toLocaleString('en-IN');
  const subtotal = (((data.subtotal || 0)) / 100).toLocaleString('en-IN');
  const discountAmount = ((data.discountAmount || 0) / 100).toLocaleString('en-IN');

  const itemsHtml = (data.items || []).map((item: any) => `
  <tr>
    <td style="padding:14px 0;border-bottom:1px solid #27272a;">
      <div style="font-weight:700;color:#ffffff;font-size:13px;letter-spacing:-0.01em;">${item.productName}</div>
      <div style="font-size:11px;color:#a1a1aa;margin-top:3px;">
        <span style="background:#27272a;color:#d4d4d8;font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;text-transform:uppercase;margin-right:6px;">PERPETUAL LICENSE</span>
        <span>Qty: ${item.quantity || 1}</span>
      </div>
    </td>
    <td align="right" valign="top" style="padding:14px 0;border-bottom:1px solid #27272a;font-weight:700;color:#ffffff;font-size:14px;font-family:'JetBrains Mono',monospace;">
      ₹${((item.price || 0) / 100).toLocaleString('en-IN')}
    </td>
  </tr>`).join('');

  const discountRow = data.discountAmount > 0 ? `
  <tr>
    <td style="padding:8px 0;font-size:12px;color:#10b981;font-weight:600;">Promo Savings (${data.couponCode || 'APPLIED'})</td>
    <td align="right" style="padding:8px 0;font-size:12px;color:#10b981;font-weight:700;font-family:'JetBrains Mono',monospace;">−₹${discountAmount}</td>
  </tr>` : '';

  const content = `
  <!-- Luxury Dark Invoice Card -->
  <div style="background:#09090b;background-image:linear-gradient(180deg, rgba(24,24,27,0.92) 0%, rgba(9,9,11,1) 100%), url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop');background-size:cover;border:1px solid #27272a;border-radius:18px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.6);">
    
    <!-- Top Gold Gradient Trim -->
    <div style="height:4px;background:linear-gradient(90deg, #f59e0b 0%, #fbbf24 50%, #d97706 100%);"></div>

    <!-- Header Block -->
    <div style="padding:28px 28px 20px;border-bottom:1px solid #27272a;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <div style="display:inline-block;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.3);color:#fbbf24;font-size:10px;font-weight:800;letter-spacing:0.1em;padding:3px 10px;border-radius:20px;text-transform:uppercase;margin-bottom:8px;">
              OFFICIAL TAX INVOICE
            </div>
            <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">Payment Confirmed</h1>
            <p style="margin:4px 0 0;font-size:12px;color:#a1a1aa;">Reference: <span style="font-family:'JetBrains Mono',monospace;color:#f4f4f5;font-weight:700;">#${orderIdShort}</span> &bull; ${orderDate}</p>
          </td>
          <td align="right" valign="top">
            <div style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);color:#34d399;font-size:11px;font-weight:800;padding:6px 14px;border-radius:999px;display:inline-block;letter-spacing:0.05em;">
              ● SETTLED
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Items List Table -->
    <div style="padding:24px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
        <thead>
          <tr>
            <th align="left" style="padding-bottom:10px;font-size:10px;font-weight:800;color:#71717a;text-transform:uppercase;letter-spacing:0.08em;">Acquired Asset</th>
            <th align="right" style="padding-bottom:10px;font-size:10px;font-weight:800;color:#71717a;text-transform:uppercase;letter-spacing:0.08em;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Financial Calculation Block -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;border-top:1px solid #27272a;padding-top:12px;">
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#a1a1aa;">Subtotal</td>
          <td align="right" style="padding:6px 0;font-size:12px;color:#d4d4d8;font-weight:600;font-family:'JetBrains Mono',monospace;">₹${subtotal}</td>
        </tr>
        ${discountRow}
        <tr>
          <td style="padding:14px 0 6px;font-size:14px;color:#ffffff;font-weight:800;">Grand Total Paid</td>
          <td align="right" style="padding:14px 0 6px;font-size:18px;color:#f59e0b;font-weight:800;font-family:'JetBrains Mono',monospace;">₹${totalPaid}</td>
        </tr>
      </table>

      <!-- Instant Vault Access Button -->
      <div style="margin-top:24px;text-align:center;">
        <a href="${SITE}/dashboard/downloads" target="_blank" style="display:block;box-sizing:border-box;background:linear-gradient(180deg, #ffffff 0%, #e4e4e7 100%);color:#09090b;font-size:13px;font-weight:800;text-decoration:none;padding:14px 24px;border-radius:12px;box-shadow:0 10px 20px -5px rgba(255,255,255,0.25);text-align:center;">
          ⚡ Access Source Files & License in Vault &rarr;
        </a>
      </div>

      <!-- Trust Stamp Footer -->
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid #18181b;text-align:center;">
        <p style="margin:0;font-size:11px;color:#71717a;line-height:1.6;">
          🔒 Cryptographically indexed tax invoice by <strong>Prontly Digital Infrastructure</strong>.<br>
          Commercial License is perpetual for unlimited client & internal production projects.
        </p>
      </div>
    </div>
  </div>`;
  
  return baseLayout(content, `Tax Invoice #${orderIdShort} — ₹${totalPaid} confirmed.`);
}

/* ─────────────────────────── 4. DELIVERY & DOWNLOAD READY ─────────────────────────── */
export function deliveryTemplate(data: any) {
  const orderIdShort = (data.id || '').slice(-8).toUpperCase();
  const itemsHtml = (data.items || [])
    .map((i: any) => `
    <tr>
      <td style="padding:12px 14px;background:#ffffff;border:1px solid ${LINE};border-radius:10px;margin-bottom:8px;">
        <div style="font-weight:700;color:${INK};font-size:13px;">📦 ${i.productName}</div>
        <div style="font-size:11px;color:${MUTED};margin-top:2px;">Format: Ready to download &bull; Perpetual License</div>
      </td>
    </tr>`)
    .join('');

  const content = `
  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-block;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);color:#065f46;font-size:10px;font-weight:800;letter-spacing:0.1em;padding:4px 12px;border-radius:20px;text-transform:uppercase;margin-bottom:12px;">
      FULFILLMENT COMPLETE
    </div>
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:${INK};letter-spacing:-0.02em;">
      Your Assets Are Ready For Download ⚡
    </h1>
    <p style="margin:0;font-size:13px;color:${SOFT};line-height:1.6;">
      Order reference <span style="font-family:'JetBrains Mono',monospace;font-weight:700;color:${INK};">#${orderIdShort}</span> has been processed.
    </p>
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
    ${itemsHtml}
  </table>

  ${btn(`${SITE}/dashboard/downloads`, 'Open My Downloads Vault', true)}

  <div style="background:${BG};border-radius:12px;padding:14px;text-align:center;">
    <p style="margin:0;font-size:11px;color:${MUTED};line-height:1.6;">
      💡 <strong>Need a download limit refresh or updated version?</strong> Your purchases include lifetime updates. Access them anytime from your account dashboard.
    </p>
  </div>`;

  return baseLayout(content, `Your Prontly digital asset downloads are ready (Order #${orderIdShort}).`);
}

/* ─────────────────────────── 5. REFUND CONFIRMATION ─────────────────────────── */
export function refundTemplate(data: any) {
  const amount = ((data.totalAmount ?? data.subtotal) || 0) / 100;
  const orderIdShort = (data.id || '').slice(-8).toUpperCase();

  const content = `
  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-block;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);color:#065f46;font-size:10px;font-weight:800;letter-spacing:0.1em;padding:4px 12px;border-radius:20px;text-transform:uppercase;margin-bottom:12px;">
      REFUND SETTLED
    </div>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${INK};letter-spacing:-0.02em;">
      Refund Confirmed
    </h1>
    <p style="margin:0;font-size:13px;color:${SOFT};line-height:1.6;">
      We've initiated a full refund for your order.
    </p>
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
    ${row('Order Reference', `#${orderIdShort}`, { mono: true })}
    ${row('Refunded Amount', `₹${amount.toLocaleString('en-IN')}`, { strong: true, green: true, mono: true })}
    ${row('Transfer Route', 'Original Payment Method')}
    ${row('Settlement Status', 'Processed by Gateway')}
  </table>

  <p style="margin:0 0 20px;font-size:12px;color:${SOFT};line-height:1.7;text-align:center;">
    Banks typically credit refunds within <strong>5–7 business days</strong>. Access to refunded assets has been removed from your vault.
  </p>

  ${btn(`${SITE}/products`, 'Return to Marketplace')}`;

  return baseLayout(content, `Refund of ₹${amount.toLocaleString('en-IN')} confirmed for Order #${orderIdShort}.`);
}

/* ─────────────────────────── 6. PASSWORD RESET DIRECT LINK ─────────────────────────── */
export function resetLinkTemplate(link: string, name: string) {
  const content = `
  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-block;background:rgba(37,99,235,0.08);border:1px solid rgba(37,99,235,0.2);color:${BRAND};font-size:10px;font-weight:800;letter-spacing:0.1em;padding:4px 12px;border-radius:20px;text-transform:uppercase;margin-bottom:12px;">
      SECURITY NOTIFICATION
    </div>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${INK};letter-spacing:-0.02em;">
      Reset Your Password
    </h1>
    <p style="margin:0;font-size:13px;color:${SOFT};line-height:1.6;">
      Hi ${name}, click below to configure a new password for your account.
    </p>
  </div>

  ${btn(link, 'Set New Password')}

  <div style="background:${BG};border:1px solid ${LINE};border-radius:12px;padding:14px;margin-bottom:18px;word-break:break-all;">
    <p style="margin:0 0 6px;font-size:11px;color:${MUTED};font-weight:600;">Direct Link Alternative:</p>
    <a href="${link}" target="_blank" style="font-size:11px;color:${BRAND};text-decoration:underline;">${link}</a>
  </div>

  <p style="margin:0;font-size:11px;color:${MUTED};text-align:center;line-height:1.6;">
    🔒 This link expires in <strong>15 minutes</strong>. If you did not make this request, your account is safe and no action is required.
  </p>`;

  return baseLayout(content, 'Reset your Prontly Store account password.');
}

/* ─────────────────────────── 7. CONTACT FORM ACKNOWLEDGEMENT ─────────────────────────── */
export function contactAckTemplate(name: string) {
  const content = `
  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-block;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);color:#065f46;font-size:10px;font-weight:800;letter-spacing:0.1em;padding:4px 12px;border-radius:20px;text-transform:uppercase;margin-bottom:12px;">
      MESSAGE RECEIVED
    </div>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${INK};letter-spacing:-0.02em;">
      We're on it, ${name}! ✉️
    </h1>
    <p style="margin:0;font-size:13px;color:${SOFT};line-height:1.6;">
      Thanks for reaching out to Prontly Support. A technical specialist has received your message and will reply within <strong>24 hours</strong>.
    </p>
  </div>

  ${btn(`${SITE}/products`, 'Explore Asset Marketplace')}

  <p style="margin:0;text-align:center;font-size:11px;color:${MUTED};">
    Prontly Support &bull; support@store.prontly.in
  </p>`;

  return baseLayout(content, `Message received — Prontly team will respond within 24 hours.`);
}

/* ─────────────────────────── 8. ADMIN ALERT (INTERNAL) ─────────────────────────── */
export function newOrderAlertTemplate(order: any) {
  const amount = ((order.totalAmount ?? order.subtotal) || 0) / 100;
  const orderIdShort = (order.id || '').slice(-8).toUpperCase();

  const content = `
  <div style="margin-bottom:20px;">
    <div style="display:inline-block;background:rgba(16,185,129,0.1);color:#065f46;font-size:10px;font-weight:800;padding:3px 10px;border-radius:20px;text-transform:uppercase;margin-bottom:8px;">
      NEW SALE NOTIFICATION
    </div>
    <h1 style="margin:0;font-size:20px;font-weight:800;color:${INK};">
      💰 New Order: ₹${amount.toLocaleString('en-IN')}
    </h1>
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
    ${row('Order Reference', `#${orderIdShort}`, { mono: true })}
    ${row('Customer Email', order.userEmail || '—')}
    ${row('Item Count', String((order.items || []).length))}
    ${row('Total Settled', `₹${amount.toLocaleString('en-IN')}`, { strong: true, green: true, mono: true })}
  </table>

  ${btn(`${SITE}/admin/orders`, 'Open Order In Admin Panel')}`;

  return baseLayout(content, `💰 New Order #${orderIdShort} — ₹${amount.toLocaleString('en-IN')}`);
}

/* ─────────────────────────── 9. NEWSLETTER BROADCAST ─────────────────────────── */
export function newsletterTemplate(input: { heading: string; bodyHtml: string; ctaLabel?: string; ctaUrl?: string }) {
  const cta = input.ctaUrl && input.ctaLabel
    ? btn(input.ctaUrl, input.ctaLabel)
    : '';

  const content = `
  <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:${INK};letter-spacing:-0.02em;text-align:center;">
    ${input.heading}
  </h1>
  
  <div style="font-size:13px;color:${SOFT};line-height:1.8;margin-bottom:20px;">
    ${input.bodyHtml}
  </div>

  ${cta}

  <p style="margin:24px 0 0;font-size:11px;color:${MUTED};text-align:center;border-top:1px solid ${LINE};padding-top:16px;">
    You received this email because you're subscribed to Prontly updates.<br>
    <a href="{{unsubscribe}}" style="color:${MUTED};text-decoration:underline;">Manage Preferences or Unsubscribe</a>
  </p>`;

  return baseLayout(content, input.heading);
}

