/**
 * @fileOverview Type definitions for the multi-sender email architecture.
 * Implements the professional inbox strategy for Prontly Store.
 */

export type EmailType = 
  | 'security' 
  | 'order' 
  | 'delivery' 
  | 'support' 
  | 'marketing' 
  | 'alert' 
  | 'legal';

export interface EmailSenderConfig {
  from: string;
  replyTo: string;
  displayName: string;
}

/**
 * Mapping of email types to specific sender addresses and reply-to rules.
 * Ensures that different business functions use dedicated inboxes.
 */
export const SENDER_MAP: Record<EmailType, EmailSenderConfig> = {
  security: {
    from: 'security@store.prontly.in',
    replyTo: 'support@store.prontly.in',
    displayName: 'Prontly Security',
  },
  order: {
    from: 'orders@store.prontly.in',
    replyTo: 'support@store.prontly.in',
    displayName: 'Prontly Orders',
  },
  delivery: {
    from: 'delivery@store.prontly.in',
    replyTo: 'support@store.prontly.in',
    displayName: 'Prontly Delivery',
  },
  support: {
    from: 'support@store.prontly.in',
    replyTo: 'support@store.prontly.in',
    displayName: 'Prontly Support',
  },
  marketing: {
    from: 'hello@store.prontly.in',
    replyTo: 'hello@store.prontly.in',
    displayName: 'Prontly Store',
  },
  alert: {
    from: 'alerts@store.prontly.in',
    replyTo: 'support@store.prontly.in',
    displayName: 'Prontly Alerts',
  },
  legal: {
    from: 'legal@store.prontly.in',
    replyTo: 'legal@store.prontly.in',
    displayName: 'Prontly Legal',
  },
};
