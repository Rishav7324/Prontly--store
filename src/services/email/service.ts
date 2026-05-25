/**
 * @fileOverview Centralized Email Dispatch Service for Prontly Store.
 * Implements a dynamic multi-sender routing logic using Resend.
 */

import { Resend } from 'resend';
import { EmailType, SENDER_MAP } from './types';

interface SendEmailProps {
  /** The business context of the email (e.g., 'security', 'order') */
  type: EmailType;
  /** Primary recipient(s) */
  to: string | string[];
  /** Email subject line */
  subject: string;
  /** Branded HTML content */
  html: string;
  /** Optional attachments */
  attachments?: any[];
  /** Optional CC recipient(s) */
  cc?: string | string[];
}

/**
 * Dispatches a branded email with automated sender routing.
 * Ensures that transactional, marketing, and security emails come from professional dedicated inboxes.
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
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      console.warn(`Email Dispatch Skipped [${type}]: RESEND_API_KEY is missing from environment.`);
      return { success: false, error: 'Email service unconfigured' };
    }

    const resend = new Resend(apiKey);

    // Dynamic Sender Selection based on the EmailType
    const config = SENDER_MAP[type];
    const fromAddress = `${config.displayName} <${config.from}>`;

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
      reply_to: config.replyTo,
      attachments,
      cc,
      // Metadata for better delivery tracking
      headers: {
        'X-Entity-Ref-ID': `${type}-${Date.now()}`,
        'X-Priority': type === 'security' || type === 'alert' ? '1 (Highest)' : '3 (Normal)',
      }
    });

    if (error) {
      console.error(`Resend Provider Failure [${type}]:`, error);
      return { success: false, error: error.message };
    }

    console.log(`Email Dispatched [${type}]: ${data?.id}`);
    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error(`Email Service Exception [${type}]:`, error.message);
    return { success: false, error: error.message };
  }
}
