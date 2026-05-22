'use server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Lists all email templates from the Resend account.
 */
export async function listTemplates() {
  if (!process.env.RESEND_API_KEY) return { success: false, error: 'API Key missing' };
  try {
    const { data, error } = await resend.emails.templates.list();
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
  try {
    const { data, error } = await resend.emails.templates.get(id);
    if (error) throw error;
    return { success: true, data };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Creates a new email template.
 */
export async function createResendTemplate(payload: { name: string; html: string; subject?: string }) {
  try {
    const { data, error } = await resend.emails.templates.create(payload);
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
  try {
    const { data, error } = await resend.emails.templates.remove(id);
    if (error) throw error;
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Lists verified domains to check delivery status.
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
