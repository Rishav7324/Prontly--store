'use server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Lists all email templates from the Resend account.
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

/**
 * Fetches a single template by ID.
 */
export async function getTemplate(id: string) {
  if (!process.env.RESEND_API_KEY) return { success: false, error: 'API Key missing' };
  try {
    const { data, error } = await resend.templates.get(id);
    if (error) throw error;
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Creates and publishes a new email template.
 */
export async function createResendTemplate(payload: { name: string; html: string; subject?: string }) {
  if (!process.env.RESEND_API_KEY) return { success: false, error: 'API Key missing' };
  try {
    // Creating and publishing in one step as per API docs
    const { data, error } = await resend.templates.create(payload);
    if (error) throw error;
    
    // Explicitly publish it if creation was successful
    if (data?.id) {
      await resend.templates.publish(data.id);
    }
    
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Updates an existing template.
 */
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

/**
 * Duplicates an existing template.
 */
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

/**
 * Deletes a template.
 */
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
 * Sends a test email using a template or raw HTML.
 */
export async function sendTestEmail(payload: { to: string; subject: string; templateId?: string; html?: string }) {
  if (!process.env.RESEND_API_KEY) return { success: false, error: 'API Key missing' };
  try {
    const { data, error } = await resend.emails.send({
      from: 'Prontly Test <onboarding@resend.dev>',
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

/**
 * Sends a newsletter campaign to multiple subscribers.
 */
export async function sendNewsletterCampaign(payload: { templateId: string; subject: string; recipients: string[] }) {
  if (!process.env.RESEND_API_KEY) return { success: false, error: 'API Key missing' };
  
  try {
    const batches = [];
    for (let i = 0; i < payload.recipients.length; i += 100) {
      batches.push(payload.recipients.slice(i, i + 100));
    }

    for (const batch of batches) {
      await resend.batch.send(
        batch.map(email => ({
          from: 'Prontly Newsletter <updates@resend.dev>', 
          to: email,
          subject: payload.subject,
          template_id: payload.templateId,
        }))
      );
    }

    return { success: true };
  } catch (e: any) {
    console.error('Broadcast failed:', e);
    return { success: false, error: e.message };
  }
}

/**
 * Lists verified domains.
 */
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
