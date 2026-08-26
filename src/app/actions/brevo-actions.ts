'use server';

/**
 * @fileOverview Brevo-powered admin email actions.
 * Same exported function names as the previous provider actions so admin pages
 * only need an import-path change. Templates are Firestore-backed
 * (Brevo transactional API has no hosted templates resource).
 */

import { getBrevoClient, sendTransactionalEmail } from '@/lib/brevo';
import { isDatabaseConfigured, getDb } from '@/lib/db';
import { siteSettings, emailTemplates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const DEFAULT_SENDER = { name: 'Prontly Store', email: 'hello@store.prontly.in' };

async function resolveSender(sender?: { fromEmail?: string; senderName?: string }) {
  if (sender?.fromEmail) {
    return { name: sender.senderName || DEFAULT_SENDER.name, email: sender.fromEmail };
  }
  // site_settings from Neon
  try {
    const db = getDb();
    const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, 'main')).limit(1);
    const es = row?.emailSettings as any;
    if (es?.fromEmail) return { name: es.senderName || DEFAULT_SENDER.name, email: es.fromEmail };
  } catch {}
  return DEFAULT_SENDER;
}

/* ─── TEMPLATES (Firestore-backed; Brevo has no hosted template API in v6 SDK) ─── */

/** Built-in templates rendered from code — always available in admin. */
const BUILT_IN_TEMPLATES = [
  {
    id: 'builtin-welcome',
    name: 'Welcome Email',
    subject: '🎉 Welcome to Prontly Store',
    builtin: true,
    description: 'Sent automatically after signup',
  },
  {
    id: 'builtin-otp',
    name: 'Password Reset OTP',
    subject: '🔐 Your verification code',
    builtin: true,
    description: 'Security code for account recovery',
  },
  {
    id: 'builtin-order',
    name: 'Order Confirmation',
    subject: '✅ Order Confirmed',
    builtin: true,
    description: 'Receipt with items and totals after payment',
  },
  {
    id: 'builtin-delivery',
    name: 'Download Ready',
    subject: '📦 Your downloads are ready',
    builtin: true,
    description: 'Fulfillment email with library link',
  },
  {
    id: 'builtin-refund',
    name: 'Refund Processed',
    subject: '↩️ Refund Processed',
    builtin: true,
    description: 'Refund confirmation with timeline',
  },
];

export async function listTemplates() {
  try {
    const db = getDb();
    const rows = await db.select().from(emailTemplates);
    const custom = rows.map((r) => ({ id: r.id, name: r.name, subject: r.subject, html: r.html, builtin: false }));
    return { success: true, data: [...BUILT_IN_TEMPLATES, ...custom] };
  } catch {
    return { success: true, data: BUILT_IN_TEMPLATES };
  }
}

export async function createResendTemplate(payload: { name: string; html: string; subject?: string }) {
  try {
    const db = getDb();
    const [row] = await db.insert(emailTemplates).values({
      name: payload.name,
      subject: payload.subject || '',
      html: payload.html || '',
    }).returning();
    return { success: true, data: { id: row.id } };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteResendTemplate(id: string) {
  try {
    const db = getDb();
    await db.delete(emailTemplates).where(eq(emailTemplates.id, id as any));
    await db.delete(emailTemplates).where(eq(emailTemplates.firestoreId, id));
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/* ─── CAMPAIGNS & BROADCASTS ─── */

export async function sendNewsletterCampaign(payload: {
  /** Neon email_templates id — or raw HTML passed via templateHtml */
  templateId?: string;
  templateHtml?: string;
  subject: string;
  recipients: string[];
  sender?: { fromEmail?: string; senderName?: string };
}) {
  try {
    let html = payload.templateHtml || '';
    if (!html && payload.templateId) {
      const db = getDb();
      let [t] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, payload.templateId as any)).limit(1);
      if (!t) [t] = await db.select().from(emailTemplates).where(eq(emailTemplates.firestoreId, payload.templateId)).limit(1);
      html = t?.html || '';
    }
    if (!html) return { success: false, error: 'Template not found or empty HTML' };

    const sender = await resolveSender(payload.sender);

    // Brevo transactional send — chunked sequentially to respect rate limits
    const CHUNK = 50;
    let sent = 0;
    for (let i = 0; i < payload.recipients.length; i += CHUNK) {
      const batch = payload.recipients.slice(i, i + CHUNK);
      const results = await Promise.allSettled(
        batch.map((email) =>
          sendTransactionalEmail({ to: email, subject: payload.subject, html, sender })
        )
      );
      sent += results.filter((r) => r.status === 'fulfilled' && (r.value as any)?.success).length;
    }

    return { success: true, data: { sent, total: payload.recipients.length } };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/* ─── AUDIENCES & CONTACTS ─── */

export async function listResendAudiences() {
  try {
    const client = getBrevoClient();
    if (!client) return { success: false, error: 'BREVO_API_KEY missing' };
    const res: any = await client.contacts.getLists();
    const lists = res?.lists || res?.body?.lists || [];
    return { success: true, data: lists.map((l: any) => ({ id: String(l.id), name: l.name })) };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createResendContact(payload: {
  audienceId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  unsubscribed?: boolean;
}) {
  try {
    const client = getBrevoClient();
    if (!client) return { success: false, error: 'BREVO_API_KEY missing' };
    await client.contacts.createContact({
      email: payload.email,
      listIds: payload.audienceId ? [Number(payload.audienceId)] : undefined,
      attributes: { FIRSTNAME: payload.firstName, LASTNAME: payload.lastName },
      updateEnabled: true,
    } as any);
    return { success: true, data: { id: payload.email } };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function listResendContacts(audienceId: string) {
  try {
    const client = getBrevoClient();
    if (!client) return { success: false, error: 'BREVO_API_KEY missing' };
    const res: any = Number(audienceId)
      ? await client.contacts.getListContacts(Number(audienceId), { limit: 100 })
      : await client.contacts.getContacts({ limit: 100 });
    const contacts = res?.contacts || res?.body?.contacts || [];
    return { success: true, data: contacts.map((c: any) => ({ id: c.email, email: c.email })) };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteResendContact(_audienceId: string, contactId: string) {
  try {
    const client = getBrevoClient();
    if (!client) return { success: false, error: 'BREVO_API_KEY missing' };
    await client.contacts.deleteContact(contactId);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/* ─── INFRASTRUCTURE ─── */

export async function listResendDomains() {
  try {
    const client = getBrevoClient();
    if (!client) return { success: false, error: 'BREVO_API_KEY missing' };
    const res: any = await client.senders.getSenders();
    const senders = res?.senders || res?.body?.senders || [];
    return {
      success: true,
      data: senders.map((s: any) => ({
        id: String(s.id),
        domain: s.email?.split('@')[1] || '',
        status: s.active ? 'verified' : 'pending',
        email: s.email,
        name: s.name,
      })),
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function sendTestEmail(payload: {
  to: string;
  subject: string;
  templateId?: string;
  templateHtml?: string;
  sender?: { fromEmail?: string; senderName?: string };
}) {
  try {
    let html = payload.templateHtml || '';
    if (!html && payload.templateId) {
      const db = getDb();
      let [t] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, payload.templateId as any)).limit(1);
      if (!t) [t] = await db.select().from(emailTemplates).where(eq(emailTemplates.firestoreId, payload.templateId)).limit(1);
      html = t?.html || '<p>Test email from Prontly</p>';
    }
    const sender = await resolveSender(payload.sender);
    const result = await sendTransactionalEmail({
      to: payload.to,
      subject: payload.subject,
      html,
      sender,
    });
    if (!result.success) return { success: false, error: result.error };
    return { success: true, data: result };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
