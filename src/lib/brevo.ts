/**
 * @fileOverview Brevo email client — singleton wrapper.
 * Replaces Resend as the transactional email provider.
 */

import { BrevoClient } from '@getbrevo/brevo';

let client: BrevoClient | null = null;

export function getBrevoClient(): BrevoClient | null {
  const key = process.env.BREVO_API_KEY;
  if (!key) return null;
  if (!client) {
    client = new BrevoClient({ apiKey: key });
  }
  return client;
}

export interface BrevoAttachment {
  /** filename e.g. "invoice.pdf" */
  name: string;
  /** base64-encoded content */
  content: string;
}

/**
 * Send a transactional email via Brevo.
 * Returns { success, messageId } style result matching previous Resend service shape.
 */
export async function sendTransactionalEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
  /** display sender, e.g. { name: 'Prontly Billing', email: 'billing@store.prontly.in' } */
  sender: { name: string; email: string };
  replyTo?: string;
  cc?: string[];
  attachments?: BrevoAttachment[];
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const client = getBrevoClient();
  if (!client) {
    console.warn('[BREVO]: BREVO_API_KEY missing — email skipped.');
    return { success: false, error: 'Email service unconfigured (BREVO_API_KEY missing)' };
  }

  const toArray = (Array.isArray(input.to) ? input.to : [input.to]).map((email) => ({ email }));

  try {
    const result = await client.transactionalEmails.sendTransacEmail({
      sender: input.sender,
      to: toArray,
      subject: input.subject,
      htmlContent: input.html,
      replyTo: input.replyTo ? { email: input.replyTo } : undefined,
      attachment: input.attachments?.map((a) => ({ name: a.name, content: a.content })),
      // Brevo v6 SDK type for cc is { email: string }[]
      ...(input.cc && input.cc.length > 0
        ? { cc: input.cc.map((email) => ({ email })) }
        : {}),
    } as any);

    const messageId =
      (result as any)?.messageId ||
      (result as any)?.response?.headers?.['message-id'] ||
      `brevo-${Date.now()}`;

    return { success: true, messageId };
  } catch (error: any) {
    console.error('[BREVO_SEND_FAILURE]:', error?.message || error);
    return { success: false, error: error?.message || 'Unknown Brevo error' };
  }
}
