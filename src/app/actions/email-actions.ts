'use server';

/**
 * @fileOverview High-level Email and Document Server Actions.
 */

import { sendEmail } from '@/services/email/service';
import {
  welcomeTemplate,
  invoiceTemplate,
  deliveryTemplate,
  refundTemplate,
  newOrderAlertTemplate,
} from '@/services/email/templates';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatPrice } from '@/lib/payment/gst';
import { generateInvoicePdf as createInvoicePdf } from '@/lib/payment/invoice';

/**
 * Dispatched immediately after account creation.
 */
export async function sendWelcomeEmail(to: string, name: string) {
  return sendEmail({
    type: 'marketing',
    to,
    subject: `🎉 Welcome to Prontly Store, ${name}!`,
    html: welcomeTemplate(name)
  });
}

/**
 * Dispatched after a successful payment verification.
 */
export async function sendOrderConfirmationEmail(order: any) {
  return sendEmail({
    type: 'order',
    to: order.userEmail,
    subject: `✅ Order Confirmed #${order.id.slice(-8).toUpperCase()} — Prontly Store`,
    html: invoiceTemplate(order)
  });
}

/**
 * Dispatched after fulfillment — download links ready.
 */
export async function sendDeliveryEmail(order: any) {
  return sendEmail({
    type: 'delivery',
    to: order.userEmail,
    subject: `📦 Your downloads are ready — Order #${order.id.slice(-8).toUpperCase()}`,
    html: deliveryTemplate(order)
  });
}

/**
 * Dispatched when an admin marks an order refunded.
 */
export async function sendRefundEmail(order: any) {
  return sendEmail({
    type: 'order',
    to: order.userEmail,
    subject: `↩️ Refund Processed — ₹${(((order.totalAmount ?? order.subtotal) || 0) / 100).toLocaleString('en-IN')} · Prontly Store`,
    html: refundTemplate(order)
  });
}

const ADMIN_ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'orders@store.prontly.in';

/**
 * Internal alert to store owner on every paid order (best-effort, never blocks fulfillment).
 */
export async function sendNewOrderAlert(order: any) {
  try {
    await sendEmail({
      type: 'alert',
      to: ADMIN_ALERT_EMAIL,
      subject: `💰 New Order ₹${(((order.totalAmount ?? order.subtotal) || 0) / 100).toLocaleString('en-IN')} — ${order.userEmail}`,
      html: newOrderAlertTemplate(order)
    });
  } catch { /* never block checkout for alerts */ }
}

/**
 * Server action to generate ultra-premium tax invoice PDF base64.
 */
export async function generateInvoicePdf(order: any, settings?: any) {
  return createInvoicePdf(order, settings);
}
