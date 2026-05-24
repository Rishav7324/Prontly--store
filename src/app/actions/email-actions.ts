'use server';

/**
 * @fileOverview High-level Email Server Actions.
 * These actions bridge the frontend with the centralized Email Service.
 */

import { sendEmail } from '@/services/email/service';
import { welcomeTemplate, invoiceTemplate } from '@/services/email/templates';

/**
 * Dispatched immediately after account creation.
 * Sender: welcome@store.prontly.in
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
 * Sender: orders@store.prontly.in
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
 * Dispatched for high-priority security notifications.
 * Sender: security@store.prontly.in
 */
export async function sendSecurityAlert(to: string, message: string) {
  return sendEmail({
    type: 'security',
    to,
    subject: '🔐 Security Alert — Prontly Store',
    html: `<div style="padding: 20px; font-family: sans-serif;"><h2 style="color: #5b52d6;">Identity Protection Alert</h2><p>${message}</p></div>`
  });
}
