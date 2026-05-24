'use server';

import { Resend } from 'resend';
import { format } from 'date-fns';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || 'Prontly Store <noreply@prontly.in>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';

/**
 * Robust Firebase Admin initialization.
 * Specifically fixes "Missing error payload" by aggressively cleaning the private key.
 */
function getAdminAuth() {
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'studio-2478374494-a2ee0';

  if (getApps().length === 0) {
    try {
      if (serviceAccountStr) {
        const serviceAccount = JSON.parse(serviceAccountStr);
        
        // CRITICAL FIX: Aggressively sanitize the private key.
        // The "Missing error payload" error is almost always caused by malformed newlines.
        if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
          serviceAccount.private_key = serviceAccount.private_key
            .replace(/\\n/g, '\n')
            .replace(/\n\n/g, '\n'); 
        }

        initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id || projectId,
        });
      } else {
        // Fallback for local development
        initializeApp({ projectId });
      }
    } catch (e) {
      console.error('Firebase Admin SDK Initialization Error:', e);
      // Ensure we have an app instance even if config-based init fails
      if (getApps().length === 0) {
        initializeApp({ projectId });
      }
    }
  }
  return getAuth();
}

// ─── EMAIL TEMPLATES (Internal Synchronous Helpers) ────────────────────────

function welcomeEmailTemplate(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Welcome to Prontly Store</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:12px;overflow:hidden;
                 box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background:#1F4E79;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;
                         font-weight:700;letter-spacing:1px;">
                🚀 Prontly Store
              </h1>
              <p style="margin:8px 0 0;color:#A8D4F5;font-size:14px;">
                Premium Digital Products Marketplace
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#1A1A2E;font-size:22px;">
                Welcome, ${name}! 🎉
              </h2>
              <p style="margin:0 0 20px;color:#444;font-size:15px;line-height:1.7;">
                Prontly Store me aapka swagat hai! Aap ab premium AI prompts,
                templates, digital assets aur productivity tools access kar sakte hain.
              </p>

              <table cellpadding="0" cellspacing="0" width="100%"
                style="background:#F0F7FF;border-radius:8px;
                       border-left:4px solid #1F4E79;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 8px;font-weight:700;color:#1F4E79;font-size:14px;">
                      ✅ Aapka account ready hai:
                    </p>
                    <p style="margin:4px 0;color:#555;font-size:14px;">
                      📧 User: ${name}
                    </p>
                    <p style="margin:4px 0;color:#555;font-size:14px;">
                      🔒 Secure login with Google or Email
                    </p>
                    <p style="margin:4px 0;color:#555;font-size:14px;">
                      📥 Instant downloads after purchase
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA BUTTON -->
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${SITE_URL}/products"
                      style="display:inline-block;background:#1F4E79;color:#ffffff;
                             text-decoration:none;padding:14px 36px;border-radius:8px;
                             font-size:15px;font-weight:700;letter-spacing:0.5px;">
                      🛍️ Products Browse Karo
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#888;font-size:13px;line-height:1.6;">
                Koi bhi sawal ho toh reply karo ya
                <a href="mailto:support@prontly.in"
                  style="color:#1F4E79;">support@prontly.in</a>
                pe contact karo.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#F8FAFC;padding:20px 40px;
                       border-top:1px solid #E2E8F0;text-align:center;">
              <p style="margin:0;color:#999;font-size:12px;">
                © ${new Date().getFullYear()} Prontly Store | store.prontly.in
              </p>
              <p style="margin:6px 0 0;color:#bbb;font-size:11px;">
                Ye email aapko isliye mila kyunki aapne Prontly Store pe account banaya.
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

function forgotPasswordTemplate(name: string, resetLink: string): string {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:12px;overflow:hidden;
                 box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:#1F4E79;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;">
                🔐 Prontly Store
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#1A1A2E;font-size:20px;">
                Password Reset Request
              </h2>
              <p style="margin:0 0 20px;color:#444;font-size:15px;line-height:1.7;">
                Hi ${name}, aapne password reset request ki hai. Niche diye
                button pe click karo — ye link <strong>15 minutes</strong> me
                expire ho jayega.
              </p>

              <table cellpadding="0" cellspacing="0" width="100%"
                style="background:#FFF3CD;border-radius:8px;
                       border-left:4px solid #F59E0B;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;color:#92400E;font-size:13px;">
                      ⚠️ Agar aapne ye request nahi ki, toh is email ko ignore
                      karo. Aapka account safe hai.
                    </p>
                  </td>
                </tr>
              </table>

              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${resetLink}"
                      style="display:inline-block;background:#DC2626;color:#ffffff;
                             text-decoration:none;padding:14px 36px;border-radius:8px;
                             font-size:15px;font-weight:700;">
                      🔑 Password Reset Karo
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;color:#888;font-size:12px;">
                Button kaam na kare toh ye link copy karo:
              </p>
              <p style="margin:0;padding:12px;background:#F8FAFC;border-radius:6px;
                        color:#1F4E79;font-size:12px;word-break:break-all;">
                ${resetLink}
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#F8FAFC;padding:20px 40px;
                       border-top:1px solid #E2E8F0;text-align:center;">
              <p style="margin:0;color:#999;font-size:12px;">
                © ${new Date().getFullYear()} Prontly Store | store.prontly.in
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

function invoiceEmailTemplate(data: any): string {
  const itemRows = data.items.map((item: any) => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #E2E8F0;
                 color:#333;font-size:14px;">${item.name}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #E2E8F0;
                 color:#333;font-size:14px;text-align:right;">
        ₹${(item.price / 100).toLocaleString('en-IN')}
      </td>
    </tr>`).join('');

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:12px;overflow:hidden;
                 box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:#1F4E79;padding:32px 40px;">
              <table width="100%">
                <tr>
                  <td>
                    <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">
                      🚀 Prontly Store
                    </h1>
                    <p style="margin:4px 0 0;color:#A8D4F5;font-size:13px;">
                      store.prontly.in
                    </p>
                  </td>
                  <td align="right">
                    <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">
                      INVOICE
                    </p>
                    <p style="margin:4px 0 0;color:#A8D4F5;font-size:13px;">
                      #${data.orderId.slice(-8).toUpperCase()}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 40px;">
              <!-- ORDER INFO -->
              <table width="100%" style="margin-bottom:28px;">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;color:#888;font-size:12px;
                               text-transform:uppercase;letter-spacing:0.5px;">
                      Bill To
                    </p>
                    <p style="margin:0;color:#1A1A2E;font-weight:700;font-size:15px;">
                      ${data.customerName}
                    </p>
                    <p style="margin:2px 0 0;color:#555;font-size:14px;">
                      ${data.customerEmail}
                    </p>
                    ${data.gstNumber ? `<p style="margin:2px 0 0;color:#555;font-size:13px;">GST: ${data.gstNumber}</p>` : ''}
                  </td>
                  <td align="right">
                    <p style="margin:0 0 4px;color:#888;font-size:12px;
                               text-transform:uppercase;letter-spacing:0.5px;">
                      Date
                    </p>
                    <p style="margin:0;color:#1A1A2E;font-size:14px;">
                      ${data.paidAt}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- SUCCESS BADGE -->
              <table width="100%" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#ECFDF5;border-radius:8px;
                             border-left:4px solid #16A34A;padding:14px 20px;">
                    <p style="margin:0;color:#15803D;font-weight:700;font-size:14px;">
                      ✅ Payment Successful — Downloads Ready!
                    </p>
                  </td>
                </tr>
              </table>

              <!-- ITEMS TABLE -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="border:1px solid #E2E8F0;border-radius:8px;
                       overflow:hidden;margin-bottom:20px;">
                <thead>
                  <tr style="background:#F0F7FF;">
                    <th style="padding:12px 16px;text-align:left;
                               color:#1F4E79;font-size:13px;">Product</th>
                    <th style="padding:12px 16px;text-align:right;
                               color:#1F4E79;font-size:13px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>

              <!-- PRICE BREAKDOWN -->
              <table width="100%" style="margin-bottom:32px;">
                <tr>
                  <td colspan="2">
                    <table width="100%" style="max-width:280px;float:right;">
                      <tr>
                        <td style="padding:6px 0;color:#666;font-size:14px;">Subtotal</td>
                        <td style="padding:6px 0;color:#333;font-size:14px;text-align:right;">
                          ₹${(data.subtotal / 100).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      ${data.discount > 0 ? `
                      <tr>
                        <td style="padding:6px 0;color:#16A34A;font-size:14px;">
                          Discount ${data.couponCode ? `(${data.couponCode})` : ''}
                        </td>
                        <td style="padding:6px 0;color:#16A34A;font-size:14px;text-align:right;">
                          -₹${(data.discount / 100).toLocaleString('en-IN')}
                        </td>
                      </tr>` : ''}
                      <tr>
                        <td style="padding:6px 0;color:#666;font-size:14px;">
                          GST (18%)
                        </td>
                        <td style="padding:6px 0;color:#333;font-size:14px;text-align:right;">
                          ₹${(data.gst / 100).toLocaleString('en-IN')}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0 6px;color:#1A1A2E;font-size:16px;
                                   font-weight:700;border-top:2px solid #1F4E79;">
                          Total Paid
                        </td>
                        <td style="padding:12px 0 6px;color:#1F4E79;font-size:16px;
                                   font-weight:700;text-align:right;
                                   border-top:2px solid #1F4E79;">
                          ₹${(data.total / 100).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- DOWNLOAD CTA -->
              <table cellpadding="0" cellspacing="0" width="100%"
                style="clear:both;">
                <tr>
                  <td align="center" style="padding:16px 0 8px;">
                    <a href="${SITE_URL}/dashboard"
                      style="display:inline-block;background:#1F4E79;color:#ffffff;
                             text-decoration:none;padding:14px 36px;border-radius:8px;
                             font-size:15px;font-weight:700;">
                      📥 Downloads Access Karo
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background:#F8FAFC;padding:20px 40px;
                       border-top:1px solid #E2E8F0;text-align:center;">
              <p style="margin:0;color:#999;font-size:12px;">
                © ${new Date().getFullYear()} Prontly Store | store.prontly.in |
                <a href="mailto:support@prontly.in"
                  style="color:#1F4E79;">support@prontly.in</a>
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

function promotionalEmailTemplate(data: any): string {
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:12px;overflow:hidden;
                 box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:linear-gradient(135deg,#1F4E79,#2E86AB);
                       padding:40px;text-align:center;">
              <p style="margin:0 0 8px;color:#A8D4F5;font-size:13px;
                         letter-spacing:2px;text-transform:uppercase;">
                🚀 Prontly Store
              </p>
              <h1 style="margin:0;color:#ffffff;font-size:28px;
                         font-weight:700;line-height:1.3;">
                ${data.promoTitle}
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.7;">
                Hi ${data.customerName}, ${data.promoDescription}
              </p>

              ${data.couponCode ? `
              <table width="100%" style="margin-bottom:28px;">
                <tr>
                  <td align="center"
                    style="background:#FFF8E7;border:2px dashed #F59E0B;
                           border-radius:12px;padding:24px;">
                    <p style="margin:0 0 8px;color:#92400E;font-size:13px;
                               font-weight:600;text-transform:uppercase;
                               letter-spacing:1px;">
                      🎁 Aapka Special Coupon Code
                    </p>
                    <p style="margin:0 0 4px;color:#1F4E79;font-size:32px;
                               font-weight:900;letter-spacing:4px;">
                      ${data.couponCode}
                    </p>
                    <p style="margin:0;color:#B7860B;font-size:14px;font-weight:600;">
                      ${data.couponDiscount} off milega!
                    </p>
                    ${data.expiryDate ? `<p style="margin:8px 0 0;color:#999;font-size:12px;">Valid till: ${data.expiryDate}</p>` : ''}
                  </td>
                </tr>
              </table>` : ''}

              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="${data.ctaUrl}"
                      style="display:inline-block;background:#1F4E79;color:#ffffff;
                             text-decoration:none;padding:14px 36px;border-radius:8px;
                             font-size:16px;font-weight:700;">
                      ${data.ctaText} →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#888;font-size:13px;">
                Sawal ho toh:
                <a href="mailto:support@prontly.in"
                  style="color:#1F4E79;">support@prontly.in</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#F8FAFC;padding:20px 40px;
                       border-top:1px solid #E2E8F0;text-align:center;">
              <p style="margin:0;color:#999;font-size:12px;">
                © ${new Date().getFullYear()} Prontly Store | store.prontly.in
              </p>
              <p style="margin:6px 0 0;">
                <a href="${data.unsubscribeUrl}"
                  style="color:#bbb;font-size:11px;">
                  Unsubscribe karo
                </a>
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

// ─── SENDER ACTIONS ─────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `🎉 Welcome to Prontly Store, ${name}!`,
      html: welcomeEmailTemplate(name),
    });
    if (result.error) throw new Error(result.error.message);
    return { success: true };
  } catch (e: any) {
    console.error('Welcome email dispatch failed:', e.message);
    return { success: false, error: e.message };
  }
}

export async function initiateBrandedPasswordReset(email: string) {
  try {
    const adminAuth = getAdminAuth();
    
    // Attempt to generate the link.
    let user;
    try {
      user = await adminAuth.getUserByEmail(email);
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address.');
      }
      throw authError;
    }

    const name = user.displayName || 'Creator';
    
    const link = await adminAuth.generatePasswordResetLink(email, {
      url: `${SITE_URL}/login`,
    });

    // Branded Link wrapping
    const oobCode = new URL(link).searchParams.get('oobCode');
    const brandedLink = `${SITE_URL}/reset-password?oobCode=${oobCode}`;

    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: '🔐 Prontly Store — Password Reset Request',
      html: forgotPasswordTemplate(name, brandedLink),
    });

    if (result.error) throw new Error(result.error.message);
    return { success: true };
  } catch (e: any) {
    console.error('Branded reset dispatch error:', e.message);
    return { 
      success: false, 
      error: e.message || 'Failed to dispatch recovery email.'
    };
  }
}

export async function sendOrderConfirmationEmail(order: any) {
  try {
    const data = {
      customerName: order.userName,
      customerEmail: order.userEmail,
      orderId: order.id,
      items: order.items.map((i: any) => ({ name: i.productName, price: i.price })),
      subtotal: order.subtotal,
      discount: order.discount || 0,
      gst: Math.round((order.total * 0.18)), // 18% GST estimate
      total: order.total,
      couponCode: order.couponCode,
      gstNumber: order.gstNumber,
      paidAt: format(new Date(), 'dd MMM yyyy'),
    };

    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: order.userEmail,
      subject: `✅ Order Confirmed #${order.id.slice(-8).toUpperCase()} — Prontly Store`,
      html: invoiceEmailTemplate(data),
    });

    if (result.error) throw new Error(result.error.message);
    return { success: true };
  } catch (e: any) {
    console.error('Order confirmation email error:', e.message);
    return { success: false, error: 'Failed to dispatch invoice' };
  }
}

export async function sendPromotionalEmail(to: string, data: any) {
  try {
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: data.promoTitle + ' — Prontly Store',
      html: promotionalEmailTemplate({
        ...data,
        unsubscribeUrl: `${SITE_URL}/unsubscribe`,
      }),
    });
    if (result.error) throw new Error(result.error.message);
    return { success: true };
  } catch (e: any) {
    console.error('Promotional dispatch error:', e.message);
    return { success: false, error: e.message };
  }
}
