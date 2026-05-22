'use server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * --- TEMPLATES API ---
 */

export async function listTemplates() {
  if (!process.env.RESEND_API_KEY) return { success: false, error: 'API Key missing' };
  try {
    const { data, error } = await resend.templates.list();
    if (error) throw error;
    return { success: true, data: data?.data || [] };
  } catch (e: any) {
    console.error('Resend List Templates Error:', e);
    return { success: false, error: e.message || 'Failed to fetch templates' };
  }
}

export async function createResendTemplate(payload: { name: string; html: string; subject?: string }) {
  if (!process.env.RESEND_API_KEY) return { success: false, error: 'API Key missing' };
  try {
    const { data, error } = await resend.templates.create(payload);
    if (error) throw error;
    
    if (data?.id) {
      await resend.templates.publish(data.id);
    }
    
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateResendTemplate(id: string, payload: { name?: string; html?: string; subject?: string }) {
  if (!process.env.RESEND_API_KEY) return { success: false, error: 'API Key missing' };
  try {
    const { data, error } = await resend.templates.update(id, payload);
    if (error) throw error;
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function duplicateResendTemplate(id: string) {
  if (!process.env.RESEND_API_KEY) return { success: false, error: 'API Key missing' };
  try {
    const { data, error } = await resend.templates.duplicate(id);
    if (error) throw error;
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteResendTemplate(id: string) {
  if (!process.env.RESEND_API_KEY) return { success: false, error: 'API Key missing' };
  try {
    const { data, error } = await resend.templates.remove(id);
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * --- CONTACTS API ---
 */

export async function listResendContacts(audienceId: string) {
  if (!process.env.RESEND_API_KEY) return { success: false, error: 'API Key missing' };
  try {
    const { data, error } = await resend.contacts.list({ audienceId });
    if (error) throw error;
    return { success: true, data: data?.data || [] };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createResendContact(payload: { 
  audienceId: string;
  email: string; 
  firstName?: string; 
  lastName?: string; 
  unsubscribed?: boolean 
}) {
  if (!process.env.RESEND_API_KEY) return { success: false, error: 'API Key missing' };
  try {
    const { data, error } = await resend.contacts.create(payload);
    if (error) throw error;
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function updateResendContact(payload: {
  audienceId: string;
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  unsubscribed?: boolean;
}) {
  if (!process.env.RESEND_API_KEY) return { success: false, error: 'API Key missing' };
  try {
    const { data, error } = await resend.contacts.update(payload);
    if (error) throw error;
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteResendContact(audienceId: string, identifier: string | { email: string }) {
  if (!process.env.RESEND_API_KEY) return { success: false, error: 'API Key missing' };
  try {
    const { data, error } = await resend.contacts.remove({
      audienceId,
      ...(typeof identifier === 'string' ? { id: identifier } : { email: identifier.email })
    });
    if (error) throw error;
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * --- AUDIENCES API (Helper for Contacts) ---
 */
export async function listResendAudiences() {
  if (!process.env.RESEND_API_KEY) return { success: false, error: 'API Key missing' };
  try {
    const { data, error } = await resend.audiences.list();
    if (error) throw error;
    return { success: true, data: data?.data || [] };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * --- INFRASTRUCTURE & DELIVERY ---
 */

export async function sendTestEmail(payload: { 
  to: string; 
  subject: string; 
  templateId?: string; 
  html?: string;
  sender?: { fromEmail?: string; senderName?: string }
}) {
  if (!process.env.RESEND_API_KEY) return { success: false, error: 'API Key missing' };
  
  const fromEmail = payload.sender?.fromEmail || 'onboarding@resend.dev';
  const senderName = payload.sender?.senderName || 'Prontly Store';

  try {
    const { data, error } = await resend.emails.send({
      from: `${senderName} Test <${fromEmail}>`,
      to: payload.to,
      subject: payload.subject,
      template_id: payload.templateId,
      html: payload.html,
    });
    if (error) throw error;
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function listResendDomains() {
  if (!process.env.RESEND_API_KEY) return { success: false, error: 'API Key missing' };
  try {
    const { data, error } = await resend.domains.list();
    if (error) throw error;
    return { success: true, data: data?.data || [] };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function sendNewsletterCampaign(payload: { 
  templateId: string; 
  subject: string; 
  recipients: string[];
  sender?: { fromEmail?: string; senderName?: string }
}) {
  if (!process.env.RESEND_API_KEY) return { success: false, error: 'API Key missing' };
  
  const fromEmail = payload.sender?.fromEmail || 'onboarding@resend.dev';
  const senderName = payload.sender?.senderName || 'Prontly Store';

  try {
    const batches = [];
    for (let i = 0; i < payload.recipients.length; i += 100) {
      batches.push(payload.recipients.slice(i, i + 100));
    }
    for (const batch of batches) {
      await resend.batch.send(
        batch.map(email => ({
          from: `${senderName} <${fromEmail}>`, 
          to: email,
          subject: payload.subject,
          template_id: payload.templateId,
        }))
      );
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}