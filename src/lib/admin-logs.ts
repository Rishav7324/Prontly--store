'use client';

export type AdminAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'UNPUBLISH';
export type ResourceType = 'PRODUCT' | 'CATEGORY' | 'COUPON' | 'BLOG_POST' | 'SETTINGS' | 'ORDER' | 'USER';

interface LogActionProps {
  adminId: string;
  adminEmail: string;
  action: AdminAction;
  resourceType: ResourceType;
  resourceId?: string;
  details?: Record<string, any>;
}

import { adminFetch } from './auth/admin-fetch';

/**
 * Fire-and-forget audit log via /api/admin/logs. No db handle required.
 */
export function logAdminAction({
  adminId,
  adminEmail,
  action,
  resourceType,
  resourceId,
  details,
}: LogActionProps): void {
  if (typeof window === 'undefined') return;
  adminFetch('/api/admin/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminId, adminEmail, action, resourceType, resourceId, details }),
  }).catch((error) => {
    console.error('Failed to log admin action:', error);
  });
}
