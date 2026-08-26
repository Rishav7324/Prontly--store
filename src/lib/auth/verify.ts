/**
 * @fileOverview Auth helpers — Firebase Auth only.
 * ID tokens verified via pure crypto (src/lib/firebase-token.ts) — no firebase-admin.
 * Roles/entitlements come from Neon Postgres (src/lib/db).
 */

import { verifyIdToken } from '@/lib/firebase-token';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface AuthUser {
  uid: string;
  email: string | null;
  name: string | null;
}

/**
 * Verify Firebase ID token from Authorization: Bearer <token>
 * Returns decoded user or throws.
 */
export async function verifyAuthToken(authHeader: string | null): Promise<AuthUser> {
  const token = authHeader?.replace('Bearer ', '').trim() || '';
  if (!token) throw new Error('UNAUTHORIZED: Missing token');

  const decoded = await verifyIdToken(token);
  return {
    uid: decoded.uid,
    email: decoded.email || null,
    name: decoded.name || decoded.email || null,
  };
}

/**
 * Check if user is admin/super-admin via Neon users table
 */
export async function isAdmin(uid: string): Promise<boolean> {
  try {
    const db = getDb();
    const [row] = await db.select({ role: users.role }).from(users).where(eq(users.uid, uid)).limit(1);
    return row?.role === 'admin' || row?.role === 'super-admin';
  } catch {
    return false;
  }
}

/**
 * Verify admin — throws if not admin
 */
export async function requireAdmin(authHeader: string | null): Promise<AuthUser> {
  const user = await verifyAuthToken(authHeader);
  const admin = await isAdmin(user.uid);
  if (!admin) throw new Error('FORBIDDEN: Admin role required');
  return user;
}
