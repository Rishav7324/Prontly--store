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
  const itemsHtml = (data.items || []).map((item: any) => `
<tr>
  <td style="padding:12px 0;border-bottom:1px solid ${LINE};">
    <div style="font-weight:600;color:${INK};font-size:13px;">${item.productName}</div>
    <div style="font-size:10px;color:${MUTED};margin-top:2px;">Digital license &times;${item.quantity || 1}</div>
  </td>
  <td align="right" valign="top" style="padding:12px 0;border-bottom:1px solid ${LINE};font-weight:600;color:${INK};font-size:13px;">
    ₹${((item.price || 0) / 100).toLocaleString('en-IN')}
  </td>
</tr>`).join('');

  const discountRow = data.discountAmount > 0
    ? row('Discount', `−₹${(data.discountAmount / 100).toLocaleString('en-IN')}`, { green: true })
    : '';

  const content = `
<table width="100%" style="margin-bottom:16px;">
<tr>
  <td>
    <h1 style="margin:0;font-size:20px;font-weight:800;color:${INK};">Order confirmed ✓</h1>
    <p style="margin:4px 0 0;font-size:11px;color:${MUTED};font-family:monospace;">#${data.id.slice(-8).toUpperCase()}</p>
  </td>
  <td align="right">
    <span style="background:#f0fdf4;color:${GREEN};font-size:10px;font-weight:700;padding:4px 12px;border-radius:999px;display:inline-block;">PAID</span>
  </td>
</tr>
</table>
<p style="margin:0 0 16px;font-size:13px;color:${SOFT};line-height:1.6;">Thanks for your purchase! Instant download links are live in your library.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">${itemsHtml}</table>
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
  ${row('Subtotal', `₹${((data.subtotal || 0) / 100).toLocaleString('en-IN')}`)}
  ${discountRow}
  <tr><td colspan="2" style="padding-top:10px;"></td></tr>
  ${row('Total paid', `₹${(((data.totalAmount ?? data.subtotal) || 0) / 100).toLocaleString('en-IN')}`, { strong: true })}
</table>
${btn(`${SITE}/dashboard/downloads`, 'Go to my downloads')}
<p style="margin:12px 0 0;font-size:11px;color:${MUTED};text-align:center;">Download limits: 5 per product · links refresh anytime from your library.</p>`;
  return baseLayout(content, `Order #${data.id.slice(-8).toUpperCase()} confirmed — downloads ready.`);
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
