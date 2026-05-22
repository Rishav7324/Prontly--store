
'use client';

import { collection, addDoc, serverTimestamp, Firestore } from 'firebase/firestore';

export type AdminAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'UNPUBLISH';
export type ResourceType = 'PRODUCT' | 'CATEGORY' | 'COUPON' | 'BLOG_POST' | 'SETTINGS';

interface LogActionProps {
  db: Firestore;
  adminId: string;
  adminEmail: string;
  action: AdminAction;
  resourceType: ResourceType;
  resourceId: string;
  details: Record<string, any>;
}

/**
 * Utility to log administrative actions to Firestore for audit purposes.
 */
export async function logAdminAction({
  db,
  adminId,
  adminEmail,
  action,
  resourceType,
  resourceId,
  details
}: LogActionProps) {
  try {
    await addDoc(collection(db, 'admin_logs'), {
      adminId,
      adminEmail,
      action,
      resourceType,
      resourceId,
      details,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}
