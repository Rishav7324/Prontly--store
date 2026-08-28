/**
 * @fileOverview Premium branded HTML email templates for Prontly Store.
 * Compact modern design matching the 2026 UI system (Inter, tight radius, subtle borders).
 */

const BRAND = '#2563eb';      // blue-600
const INK = '#18181b';        // zinc-900
const SOFT = '#52525b';       // zinc-600
const MUTED = '#a1a1aa';      // zinc-400
const LINE = '#e4e4e7';       // zinc-200
const BG = '#fafafa';         // zinc-50
const CARD = '#ffffff';
const GREEN = '#16a34a';
const LOGO_URL = 'https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png';
const SITE = 'https://store.prontly.in';

function btn(url: string, label: string) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto">
    <tr>
      <td align="center">
        <a href="${url}" style="display:inline-block;background:${INK};color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">${label}</a>
      </td>
    </tr>
  </table>`;
}

/** Base layout wrapper — compact card, consistent branding. */
function baseLayout(content: string, previewText: string) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>Prontly Store</title>
<style>
@media only screen and (max-width:600px){
.container{width:100%!important}
.card{border-radius:12px!important;padding:24px!important}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:${BG};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<span style="display:none;font-size:1px;color:${BG};line-height:1px;max-height:0;overflow:hidden;">${previewText}</span>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BG};">
<tr><td align="center" style="padding:32px 12px;">
<table class="container" width="560" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding-bottom:20px;">
      <img src="${LOGO_URL}" alt="Prontly" width="36" height="36" style="display:block;border-radius:9px;margin:0 auto 8px;">
      <span style="font-size:14px;font-weight:700;color:${INK};">Prontly <span style="color:${BRAND}">Store</span></span>
    </td>
  </tr>
  <tr>
    <td class="card" style="background-color:${CARD};border-radius:12px;padding:32px;border:1px solid ${LINE};">${content}</td>
  </tr>
  <tr>
    <td align="center" style="padding-top:20px;">
      <p style="margin:0 0 8px;font-size:11px;color:${MUTED};line-height:1.6;">
        &copy; ${year} Prontly Store &middot;
        <a href="${SITE}/privacy" style="color:${MUTED};text-decoration:none;">Privacy</a> &middot;
        <a href="${SITE}/terms" style="color:${MUTED};text-decoration:none;">Terms</a> &middot;
        <a href="${SITE}/contact" style="color:${MUTED};text-decoration:none;">Support</a>
      </p>
      <p style="margin:0;font-size:10px;color:${MUTED};">Sent by Prontly &mdash; digital assets for professional creators.</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function row(label: string, value: string, opts?: { strong?: boolean; green?: boolean }) {
  const color = opts?.green ? GREEN : opts?.strong ? INK : SOFT;
  const weight = opts?.strong ? '700' : '500';
  return `<tr>
<td style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:12px;color:${SOFT};">${label}</td>
<td style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:12px;color:${color};font-weight:${weight};text-align:right;">${value}</td>
</tr>`;
}

/* ─────────────────────────── WELCOME ─────────────────────────── */
export function welcomeTemplate(name: string) {
  const content = `
<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${INK};text-align:center;">Welcome, ${name}! 🎉</h1>
<p style="margin:0 0 20px;font-size:13px;color:${SOFT};line-height:1.7;text-align:center;">You've joined a community of creators who use high-performance digital assets.</p>
<div style="background:${BG};border-radius:8px;padding:16px;margin-bottom:20px;">
  <p style="margin:0 0 6px;font-weight:700;color:${INK};font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Next steps</p>
  <ol style="margin:0;padding-left:18px;color:${SOFT};font-size:12px;line-height:2;">
    <li>Browse AI prompts, templates and automation systems</li>
    <li>Instant downloads land in your dashboard library</li>
    <li>Lifetime updates on every purchase</li>
  </ol>
</div>
${btn(`${SITE}/products`, 'Browse catalog')}`;
  return baseLayout(content, `Welcome to Prontly Store, ${name}!`);
}

/* ─────────────────────────── OTP / SECURITY ─────────────────────────── */
export function otpTemplate(otp: string, name: string) {
  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:800;color:${INK};text-align:center;">Security code</h1>
<p style="margin:0 0 24px;font-size:13px;color:${SOFT};line-height:1.6;text-align:center;">Hi ${name}, use this code to complete your password reset.</p>
<div align="center" style="margin-bottom:24px;">
  <div style="background:${BG};border:1px solid ${LINE};border-radius:10px;padding:18px 32px;display:inline-block;">
    <span style="font-size:38px;font-weight:800;letter-spacing:10px;color:${BRAND};font-family:'JetBrains Mono',monospace;">${otp}</span>
  </div>
</div>
<p style="margin:0;background:#fff7ed;border-radius:8px;padding:12px 14px;font-size:11px;color:#9a3412;line-height:1.6;text-align:center;">
<strong>Expires in 10 minutes.</strong> Didn't request this? Your account is safe — ignore this email or contact security@store.prontly.in.
</p>`;
  return baseLayout(content, `${otp} is your Prontly verification code.`);
}

/* ─────────────────────────── ORDER CONFIRMATION ─────────────────────────── */
export function invoiceTemplate(data: any) {
  const orderDate = data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today';
  const orderIdShort = (data.id || '').slice(-8).toUpperCase();
  const totalPaid = (((data.totalAmount ?? data.subtotal) || 0) / 100).toLocaleString('en-IN');
  const subtotal = (((data.subtotal || 0)) / 100).toLocaleString('en-IN');
  const discountAmount = ((data.discountAmount || 0) / 100).toLocaleString('en-IN');

  const itemsHtml = (data.items || []).map((item: any) => `
  <tr>
    <td style="padding:14px 0;border-bottom:1px solid #27272a;">
      <div style="font-weight:700;color:#ffffff;font-size:13px;letter-spacing:-0.01em;">${item.productName}</div>
      <div style="font-size:11px;color:#a1a1aa;margin-top:3px;display:flex;align-items:center;">
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
    <td style="padding:8px 0;font-size:12px;color:#10b981;font-weight:600;">Promo Discount (${data.couponCode || 'APPLIED'})</td>
    <td align="right" style="padding:8px 0;font-size:12px;color:#10b981;font-weight:700;font-family:'JetBrains Mono',monospace;">−₹${discountAmount}</td>
  </tr>` : '';

  const content = `
  <!-- Luxury Dark Invoice Container with Background Header Texture -->
  <div style="background:#09090b;background-image:linear-gradient(180deg, rgba(24,24,27,0.9) 0%, rgba(9,9,11,1) 100%), url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop');background-size:cover;border:1px solid #27272a;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
    
    <!-- Top Gold Accent Bar -->
    <div style="height:4px;background:linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #b45309 100%);"></div>

    <!-- Header Block -->
    <div style="padding:28px 28px 20px;border-bottom:1px solid #27272a;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td>
            <div style="display:inline-block;background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.3);color:#fbbf24;font-size:10px;font-weight:800;letter-spacing:0.1em;padding:3px 10px;border-radius:20px;text-transform:uppercase;margin-bottom:8px;">
              OFFICIAL TAX INVOICE
            </div>
            <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">Payment Confirmed</h1>
            <p style="margin:4px 0 0;font-size:12px;color:#a1a1aa;">Order Reference: <span style="font-family:'JetBrains Mono',monospace;color:#f4f4f5;font-weight:700;">#${orderIdShort}</span> &bull; ${orderDate}</p>
          </td>
          <td align="right" valign="top">
            <div style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);color:#34d399;font-size:11px;font-weight:800;padding:6px 14px;border-radius:999px;display:inline-block;letter-spacing:0.05em;">
              ● SETTLED
            </div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Main Body & Items -->
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

      <!-- Action Button -->
      <div style="margin-top:24px;text-align:center;">
        <a href="${SITE}/dashboard/downloads" style="display:inline-block;width:100%;box-sizing:border-box;background:linear-gradient(180deg, #ffffff 0%, #e4e4e7 100%);color:#09090b;font-size:13px;font-weight:700;text-decoration:none;padding:14px 24px;border-radius:12px;box-shadow:0 10px 20px -5px rgba(255,255,255,0.2);">
          ⚡ Access Source Files & License in Vault &rarr;
        </a>
      </div>

      <!-- Trust Stamp Footer -->
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid #18181b;text-align:center;">
        <p style="margin:0;font-size:11px;color:#71717a;line-height:1.6;">
          🔒 Cryptographically signed by <strong>Prontly Digital Infrastructure</strong>.<br>
          Commercial License is perpetual for unlimited client & internal projects.
        </p>
      </div>
    </div>
  </div>`;
  
  return baseLayout(content, `Tax Invoice #${orderIdShort} — ₹${totalPaid} confirmed.`);
}

/* ─────────────────────────── DELIVERY / DOWNLOADS READY ─────────────────────────── */
export function deliveryTemplate(data: any) {
  const itemsHtml = (data.items || [])
    .map((i: any) => `<li style="margin-bottom:4px;"><strong style="color:${INK};">${i.productName}</strong></li>`)
    .join('');
  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:800;color:${INK};text-align:center;">Your files are ready 📦</h1>
<p style="margin:0 0 18px;font-size:13px;color:${SOFT};line-height:1.6;text-align:center;">Order <span style="font-family:monospace;">#${data.id.slice(-8).toUpperCase()}</span> has been fulfilled.</p>
<ul style="margin:0 0 20px;padding-left:18px;font-size:12px;color:${SOFT};line-height:1.9;">${itemsHtml}</ul>
${btn(`${SITE}/dashboard/downloads`, 'Open my downloads')}
<p style="margin:14px 0 0;font-size:11px;color:${MUTED};text-align:center;">Each file can be downloaded up to 5 times. Need a limit refresh? Reply to this email.</p>`;
  return baseLayout(content, 'Your Prontly download is ready.');
}

/* ─────────────────────────── REFUND ─────────────────────────── */
export function refundTemplate(data: any) {
  const amount = ((data.totalAmount ?? data.subtotal) || 0) / 100;
  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:800;color:${INK};text-align:center;">Refund processed</h1>
<p style="margin:0 0 20px;font-size:13px;color:${SOFT};line-height:1.6;text-align:center;">We've refunded your order — no hard feelings.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
  ${row('Order', `<span style="font-family:monospace;">#${data.id.slice(-8).toUpperCase()}</span>`)}
  ${row('Refund amount', `₹${amount.toLocaleString('en-IN')}`, { strong: true, green: true })}
  ${row('Status', 'Processing with bank')}
</table>
<p style="margin:0 0 18px;font-size:12px;color:${SOFT};line-height:1.7;">
Banks typically take <strong>5–7 working days</strong> to credit refunds back to the original payment method.
Your access to refunded files has been revoked.
</p>
${btn(`${SITE}/products`, 'Browse store')}`;
  return baseLayout(content, `Refund of ₹${amount.toLocaleString('en-IN')} processed.`);
}

/* ─────────────────────────── NEWSLETTER BROADCAST ─────────────────────────── */
export function newsletterTemplate(input: { heading: string; bodyHtml: string; ctaLabel?: string; ctaUrl?: string }) {
  const cta = input.ctaUrl && input.ctaLabel
    ? btn(input.ctaUrl, input.ctaLabel)
    : '';
  const content = `
<h1 style="margin:0 0 12px;font-size:20px;font-weight:800;color:${INK};text-align:center;">${input.heading}</h1>
<div style="font-size:13px;color:${SOFT};line-height:1.8;">${input.bodyHtml}</div>
${cta}
<p style="margin:16px 0 0;font-size:11px;color:${MUTED};text-align:center;">
You're receiving this because you subscribed at store.prontly.in.<br>
<a href="{{unsubscribe}}" style="color:${MUTED};text-decoration:underline;">Unsubscribe</a>
</p>`;
  return baseLayout(content, input.heading);
}

/* ─────────────────────────── RESET LINK ─────────────────────────── */
export function resetLinkTemplate(link: string, name: string) {
  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:800;color:${INK};text-align:center;">Reset your password</h1>
<p style="margin:0 0 20px;font-size:13px;color:${SOFT};line-height:1.7;text-align:center;">Hi ${name}, click the button below to set a new password for your Prontly account.</p>
${btn(link, 'Reset password')}
<p style="margin:16px 0 0;background:${BG};border:1px solid ${LINE};border-radius:8px;padding:12px 14px;font-size:11px;color:${SOFT};line-height:1.6;text-align:center;word-break:break-all;">
If the button doesn't work, copy and paste this link:<br>
<a href="${link}" style="color:${BRAND};word-break:break-all;">${link}</a>
</p>
<p style="margin:14px 0 0;font-size:11px;color:${MUTED};text-align:center;line-height:1.6;">
This link expires in <strong>15 minutes</strong> and can only be used once.<br>
Didn't request this? Ignore this email — your password won't change.
</p>`;
  return baseLayout(content, 'Reset your Prontly password');
}

/* ─────────────────────────── CONTACT FORM ACK ─────────────────────────── */
export function contactAckTemplate(name: string) {
  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:800;color:${INK};text-align:center;">Message received ✉️</h1>
<p style="margin:0 0 18px;font-size:13px;color:${SOFT};line-height:1.7;text-align:center;">
Hi ${name}, thanks for reaching out! Our team will reply within <strong>24 hours</strong>.
</p>
${btn(`${SITE}/products`, 'Explore products while you wait')}`;
  return baseLayout(content, 'We got your message — reply within 24 hours.');
}

/* ─────────────────────────── ADMIN ALERT (internal) ─────────────────────────── */
export function newOrderAlertTemplate(order: any) {
  const amount = ((order.totalAmount ?? order.subtotal) || 0) / 100;
  const content = `
<h1 style="margin:0 0 12px;font-size:18px;font-weight:800;color:${INK};">New paid order 💰</h1>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
  ${row('Order', `<span style="font-family:monospace;">#${order.id.slice(-8).toUpperCase()}</span>`)}
  ${row('Customer', order.userEmail || '—')}
  ${row('Items', String((order.items || []).length))}
  ${row('Value', `₹${amount.toLocaleString('en-IN')}`, { strong: true })}
</table>
${btn(`${SITE}/admin/orders`, 'Open admin orders')}`;
  return baseLayout(content, `New order ₹${amount.toLocaleString('en-IN')} just came in.`);
}
