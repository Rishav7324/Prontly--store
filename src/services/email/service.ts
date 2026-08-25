/**
 * @fileOverview Centralized Email Dispatch Service for Prontly Store.
 * Provider: Brevo (migrated from Resend). Same public sendEmail() signature —
 * call sites (email-actions.ts, OTP route) need zero changes.
 */

import { EmailType, SENDER_MAP } from './types';
import { sendTransactionalEmail, type BrevoAttachment } from '@/lib/brevo';

interface SendEmailProps {
  /** The business context of the email (e.g., 'security', 'order') */
  type: EmailType;
  /** Primary recipient(s) */
  to: string | string[];
  /** Email subject line */
  subject: string;
  /** Branded HTML content */
  html: string;
  /** Optional attachments: Resend-style { content: base64, filename } — mapped to Brevo format */
  attachments?: { content: string; filename: string }[];
  /** Optional CC recipient(s) */
  cc?: string | string[];
}

/**
 * Dispatches a branded email with automated sender routing via Brevo.
 */
export async function sendEmail({
  type,
  to,
  subject,
  html,
  attachments,
  cc
}: SendEmailProps) {
  try {
    const config = SENDER_MAP[type];
    const sender = { name: config.displayName, email: config.from };

    // Map Resend-style attachments to Brevo-style
    const brevoAttachments: BrevoAttachment[] | undefined = attachments?.map((a) => ({
      name: a.filename,
      content: a.content,
    }));

    const result = await sendTransactionalEmail({
      to,
      subject,
      html,
      sender,
      replyTo: config.replyTo,
      cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
      attachments: brevoAttachments,
    });

    if (!result.success) {
      console.error(`Brevo Provider Failure [${type}]:`, result.error);
      return { success: false, error: result.error };
    }

    console.log(`Email Dispatched [${type}]: ${result.messageId}`);
    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error(`Email Service Exception [${type}]:`, error.message);
    return { success: false, error: error.message };
  }
}
