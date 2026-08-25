/**
 * SQL replacement for src/lib/admin-logs.ts (Firestore version)
 */

import { getDb } from '@/lib/db';
import { adminLogs } from '@/lib/db/schema';

export type AdminAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'UNPUBLISH';
export type ResourceType = 'PRODUCT' | 'CATEGORY' | 'COUPON' | 'BLOG_POST' | 'SETTINGS' | 'ORDER' | 'USER';

interface LogActionProps {
  adminId: string;
  adminEmail: string;
  action: AdminAction;
  resourceType: ResourceType;
  resourceId: string;
  details: Record<string, any>;
}

export async function logAdminAction({
  adminId,
  adminEmail,
  action,
  resourceType,
  resourceId,
  details,
}: LogActionProps) {
  try {
    const db = getDb();
    await db.insert(adminLogs).values({
      adminId,
      adminEmail,
      action: action as any,
      resourceType: resourceType as any,
      resourceId,
      details,
    });
  } catch (error) {
    console.error('Failed to log admin action (SQL):', error);
  }
}
