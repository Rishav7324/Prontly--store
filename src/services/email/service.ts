/**
 * @fileOverview Centralized Email Dispatch Service.
 * Implements multi-sender routing logic and Resend integration.
 */

import { Resend } from 'resend';
import { EmailType, SENDER_MAP } from './types';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailProps {
  type: EmailType;
  to: string | string[];
  subject: string;
  html: string;
  attachments?: any[];
  cc?: string | string[];
}

/**
 * Robust email dispatcher with dynamic sender selection.
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
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is missing in environment variables.');
    }

    const config = SENDER_MAP[type];
    const from = `${config.displayName} <${config.from}>`;

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      reply_to: config.replyTo,
      attachments,
      cc,
      headers: {
        'X-Entity-Ref-ID': `${type}-${Date.now()}`,
        'X-Priority': type === 'security' || type === 'alert' ? '1 (Highest)' : '3 (Normal)',
      }
    });

    if (error) {
      console.error(`Resend dispatch failure [${type}]:`, error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error: any) {
    console.error(`Email Service Crash [${type}]:`, error.message);
    return { success: false, error: error.message };
  }
}
