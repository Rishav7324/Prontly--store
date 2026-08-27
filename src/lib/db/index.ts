/**
 * @fileOverview Neon Postgres client — Firestore replacement.
 * Uses @neondatabase/serverless (HTTP) for edge/serverless, fallback to pg Pool for long transactions.
 * Auth still via Firebase Admin (verifyIdToken) — see src/lib/auth/verify.ts
 */

import 'server-only';

import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePg } from 'drizzle-orm/neon-serverless';
import { neon, Pool } from '@neondatabase/serverless';
import * as schema from './schema';


function getDatabaseUrl(): string | null {
  return process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || null;
}

let _neonDb: ReturnType<typeof drizzleNeon> | null = null;
let _pgPool: Pool | null = null;
let _pgDb: ReturnType<typeof drizzlePg> | null = null;

/**
 * Get Drizzle instance (Neon HTTP) — for most queries (fast, serverless)
 */
export function getDb() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      'DATABASE_URL missing. Set Neon connection string in .env. Example: postgres://user:pass@ep-...neon.tech/neondb?sslmode=require'
    );
  }
  if (!_neonDb) {
    const sql = neon(url);
    _neonDb = drizzleNeon(sql, { schema });
  }
  return _neonDb;
}

/**
 * Get pg Pool Drizzle instance — for transactions (create-order, verify) that need `BEGIN/COMMIT`
 * Neon HTTP does not support interactive transactions well, so we use Pool.
 */
export function getPgDb() {
  const url = getDatabaseUrl();
  if (!url) throw new Error('DATABASE_URL missing for pg Pool');
  if (!_pgDb) {
    _pgPool = new Pool({ connectionString: url });
    _pgDb = drizzlePg(_pgPool as any, { schema });
  }
  return { db: _pgDb, pool: _pgPool! };
}

export function isDatabaseConfigured(): boolean {
  return !!getDatabaseUrl();
}

// Re-export schema for convenience
export * from './schema';
export { schema };
