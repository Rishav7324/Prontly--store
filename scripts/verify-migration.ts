#!/usr/bin/env tsx
/**
 * Verify Firestore vs Neon counts match after migration
 */

import 'dotenv/config';
import { getAdminDb } from '../src/lib/firebase-admin';
import { getDb } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function countFirestore(col: string): Promise<number> {
  try {
    const snap = await getAdminDb().collection(col).count().get();
    return snap.data().count;
  } catch {
    const snap = await getAdminDb().collection(col).get();
    return snap.size;
  }
}

async function countNeon(table: string): Promise<number> {
  const db = getDb();
  const res: any = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM "${table}"`));
  // neon-http returns {rows: [...]}, pg returns {rows}
  const rows = (res as any).rows || res;
  return Number(rows[0]?.count ?? rows[0]?.count ?? 0);
}

async function main() {
  console.log('🔍 Verifying Firestore vs Neon...\n');
  const checks: [string, string][] = [
    ['users', 'users'],
    ['products', 'products'],
    ['categories', 'categories'],
    ['coupons', 'coupons'],
    ['orders', 'orders'],
    ['reviews', 'reviews'],
    ['blog_posts', 'blog_posts'],
    ['newsletter_subscribers', 'newsletter_subscribers'],
    ['admin_logs', 'admin_logs'],
  ];

  const results: any[] = [];
  for (const [fs, neon] of checks) {
    const fsCount = await countFirestore(fs).catch(() => -1);
    const neonCount = await countNeon(neon).catch((e) => {
      console.error(`Neon ${neon} error:`, e.message);
      return -1;
    });
    const ok = fsCount === neonCount ? '✅' : fsCount === -1 || neonCount === -1 ? '⚠️' : '❌';
    results.push({ collection: fs, firestore: fsCount, neon: neonCount, match: ok });
  }

  // Downloads subcollection special
  try {
    const dlSnap = await getAdminDb().collectionGroup('products').where('__name__', '>', '').get().catch(async () => {
      // fallback: count via listDocuments
      const users = await getAdminDb().collection('downloads').listDocuments();
      let c = 0;
      for (const u of users) c += (await u.collection('products').get()).size;
      return { size: c } as any;
    });
    const fsDl = (dlSnap as any).size;
    const neonDl = await countNeon('downloads').catch(() => -1);
    results.push({ collection: 'downloads', firestore: fsDl, neon: neonDl, match: fsDl === neonDl ? '✅' : '❌' });
  } catch {}

  console.table(results);

  // Revenue check
  try {
    const db = getDb();
    const r: any = await db.execute(sql.raw(`SELECT COALESCE(SUM(total_amount),0) as sum FROM orders WHERE status='paid'`));
    const rows = (r as any).rows || r;
    const neonRevenue = Number(rows[0]?.sum ?? 0);
    console.log(`\nNeon paid revenue (paise): ${neonRevenue} = ₹${(neonRevenue / 100).toLocaleString('en-IN')}`);
  } catch (e: any) {
    console.error('Revenue check failed:', e.message);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
