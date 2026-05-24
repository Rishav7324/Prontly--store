'use server';

/**
 * @fileOverview Refactored Email Server Actions.
 * Now utilizes the centralized Email Service for consistent multi-sender routing.
 */

import { sendEmail } from '@/services/email/service';
import { welcomeTemplate, invoiceTemplate } from '@/services/email/templates';

export async function sendWelcomeEmail(to: string, name: string) {
  return sendEmail({
    type: 'marketing',
    to,
    subject: `🎉 Welcome to Prontly Store, ${name}!`,
    html: welcomeTemplate(name)
  });
}

export async function sendOrderConfirmationEmail(order: any) {
  return sendEmail({
    type: 'order',
    to: order.userEmail,
    subject: `✅ Order Confirmed #${order.id.slice(-8).toUpperCase()} — Prontly Store`,
    html: invoiceTemplate(order)
  });
}

/**
 * For standard Firebase password reset fallbacks (if used)
 */
export async function sendSecurityAlert(to: string, message: string) {
  return sendEmail({
    type: 'security',
    to,
    subject: '🔐 Security Alert — Prontly Store',
    html: `<p>${message}</p>`
  });
}
