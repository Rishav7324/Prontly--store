
'use server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * --- TEMPLATES API ---
 */
export async function listTemplates() {
  try {
    const { data, error } = await resend.templates.list();
    if (error) throw error;
    return { success: true, data: data?.data || [] };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createResendTemplate(payload: { name: string; html: string; subject?: string }) {
  try {
    const { data, error } = await resend.templates.create(payload);
    if (error) throw error;
    if (data?.id) await resend.templates.publish(data.id);
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function deleteResendTemplate(id: string) {
  try {
    const { data, error } = await resend.templates.remove(id);
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * --- AUDIENCES & CONTACTS ---
 */
export async function listResendAudiences() {
  try {
    const { data, error } = await resend.audiences.list();
    if (error) throw error;
    return { success: true, data: data?.data || [] };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function createResendContact(payload: { audienceId: string; email: string; firstName?: string; lastName?: string }) {
  try {
    const { data, error } = await resend.contacts.create(payload);
    if (error) throw error;
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function listResendContacts(audienceId: string) {
  try {
    const { data, error } = await resend.contacts.list({ audienceId });
    if (error) throw error;
    return { success: true, data: data?.data || [] };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * --- INFRASTRUCTURE ---
 */
export async function listResendDomains() {
  try {
    const { data, error } = await resend.domains.list();
    if (error) throw error;
    return { success: true, data: data?.data || [] };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function sendTestEmail(payload: { to: string; subject: string; templateId: string }) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Prontly Test <noreply@store.prontly.in>',
      to: payload.to,
      subject: payload.subject,
      template_id: payload.templateId,
    });
    if (error) throw error;
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
