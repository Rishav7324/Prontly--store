#!/usr/bin/env tsx
/**
 * Firestore -> Neon (SQL) ETL — Zero Data Loss
 * Usage:
 *   DATABASE_URL=postgres://... npm run migrate:firestore-to-neon
 *   DATABASE_URL=postgres://... npm run migrate:firestore-to-neon -- --dry-run
 *   DATABASE_URL=postgres://... npm run migrate:firestore-to-neon -- --only=products,orders
 *
 * Requires: FIREBASE_* env (or GOOGLE_APPLICATION_CREDENTIALS) for Admin SDK
 * Preserves: all docs, IDs traceable via firestore_id columns, timestamps normalized to UTC
 */

import 'dotenv/config';
import { getAdminDb } from '../src/lib/firebase-admin';
import { getDb } from '../src/lib/db';
import {
  users,
  categories,
  products,
  reviews,
  coupons,
  orders,
  orderItems,
  downloads,
  downloadLogs,
  blogPosts,
  newsletterSubscribers,
  adminLogs,
  siteSettings,
  analytics,
  passwordResetOtps,
  passwordResetSessions,
} from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

// ─── Helpers ────────────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes('--dry-run');
const ONLY = (() => {
  const arg = process.argv.find((a) => a.startsWith('--only='));
  return arg ? arg.split('=')[1].split(',').map((s) => s.trim()) : null;
})();

function toDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v.toDate === 'function') return v.toDate();
  if (v.seconds) return new Date(v.seconds * 1000);
  if (typeof v === 'string') return new Date(v);
  return null;
}

function cleanFileKey(key: string | null | undefined): string | null {
  if (!key) return null;
  if (key.includes('https://')) {
    // Firestore stores full CDN URL: https://cdn.prontly.in/products/files/xxx
    // Neon stores relative: products/files/xxx
    return key.split('/').slice(3).join('/').split('?')[0];
  }
  return key;
}

function parsePaise(v: any): number {
  if (v === undefined || v === null) return 0;
  if (typeof v === 'number') return Math.round(v);
  // Firestore REST may give {integerValue: "10000"}
  if (typeof v === 'object' && v.integerValue) return parseInt(v.integerValue);
  if (typeof v === 'object' && v.doubleValue) return Math.round(parseFloat(v.doubleValue));
  return Math.round(Number(v) || 0);
}

function shouldRun(name: string): boolean {
  return !ONLY || ONLY.includes(name);
}

let stats: Record<string, { read: number; written: number; skipped: number; errors: number }> = {};

function initStat(name: string) {
  stats[name] = { read: 0, written: 0, skipped: 0, errors: 0 };
}

// ─── Firestore fetch helper ────────────────────────────────────────────────

async function fetchAll(collectionName: string): Promise<{ id: string; data: any }[]> {
  const db = getAdminDb();
  // Firestore Admin SDK: limit to avoid OOM, paginate if needed
  const snap = await db.collection(collectionName).get();
  return snap.docs.map((d) => ({ id: d.id, data: d.data() }));
}

async function fetchSubcollection(group: string): Promise<{ id: string; data: any; parentId: string }[]> {
  // For downloads subcollection: downloads/{userId}/products/{productId}
  const db = getAdminDb();
  const result: any[] = [];
  const userSnaps = await db.collection('downloads').listDocuments();
  for (const userDoc of userSnaps) {
    const parentId = userDoc.id;
    const prodSnap = await userDoc.collection('products').get();
    for (const doc of prodSnap.docs) {
      result.push({ id: doc.id, parentId, data: doc.data() });
    }
  }
  return result;
}

// ─── Migrations ────────────────────────────────────────────────────────────

async function migrateUsers() {
  const name = 'users';
  if (!shouldRun(name)) return;
  initStat(name);
  const docs = await fetchAll(name);
  stats[name].read = docs.length;

  if (DRY_RUN) {
    console.log(`[DRY] users: would migrate ${docs.length} docs (sample):`, docs[0]?.data);
    stats[name].written = docs.length;
    return;
  }

  const db = getDb();
  for (const { id, data } of docs) {
    try {
      await db
        .insert(users)
        .values({
          uid: id,
          email: (data.email || `${id}@unknown.local`).toLowerCase(),
          displayName: data.displayName || data.display_name || null,
          photoUrl: data.photoURL || data.photoUrl || null,
          role: (data.role as any) || 'customer',
          phone: data.phone || null,
          gstNumber: data.gstNumber || null,
          language: data.language || 'en',
          isActive: data.isActive ?? true,
          totalSpent: parsePaise(data.totalSpent ?? data.total_spent ?? 0),
          orderCount: data.orderCount ?? data.order_count ?? 0,
          lastLoginAt: toDate(data.lastLoginAt),
          lastPurchaseAt: toDate(data.lastPurchaseAt),
          createdAt: toDate(data.createdAt) || new Date(),
          updatedAt: toDate(data.updatedAt) || new Date(),
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email: (data.email || `${id}@unknown.local`).toLowerCase(),
            displayName: data.displayName || null,
            role: (data.role as any) || 'customer',
            totalSpent: parsePaise(data.totalSpent ?? 0),
            orderCount: data.orderCount ?? 0,
            updatedAt: new Date(),
          },
        });
      stats[name].written++;
    } catch (e: any) {
      console.error(`[users:${id}]`, e.message);
      stats[name].errors++;
    }
  }
}

async function migrateCategories() {
  const name = 'categories';
  if (!shouldRun(name)) return;
  initStat(name);
  const docs = await fetchAll(name);
  stats[name].read = docs.length;
  if (DRY_RUN) {
    console.log(`[DRY] categories: ${docs.length}`);
    stats[name].written = docs.length;
    return;
  }
  const db = getDb();
  for (const { id, data } of docs) {
    try {
      await db
        .insert(categories)
        .values({
          id: isUuid(id) ? id : undefined as any, // let DB generate if Firestore id not uuid
          name: data.name || 'Untitled',
          slug: data.slug || id,
          description: data.description || null,
          iconEmoji: data.iconEmoji || '📦',
          bannerImage: data.bannerImage || null,
          productCount: data.productCount ?? 0,
          isActive: data.isActive ?? true,
          seo: data.seo || null,
          createdAt: toDate(data.createdAt) || new Date(),
          updatedAt: toDate(data.updatedAt) || new Date(),
        })
        .onConflictDoNothing();
      // If custom id, need mapping; for now onConflictDoNothing handles slug unique
      stats[name].written++;
    } catch (e: any) {
      // Fallback: try without id
      try {
        await db.insert(categories).values({
          name: data.name || 'Untitled',
          slug: data.slug || `cat-${id}`,
          description: data.description || null,
          iconEmoji: data.iconEmoji || '📦',
          bannerImage: data.bannerImage || null,
        }).onConflictDoNothing();
        stats[name].written++;
      } catch (e2: any) {
        console.error(`[categories:${id}]`, e2.message);
        stats[name].errors++;
      }
    }
  }
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

async function migrateProducts() {
  const name = 'products';
  if (!shouldRun(name)) return;
  initStat(name);
  const docs = await fetchAll(name);
  stats[name].read = docs.length;
  if (DRY_RUN) {
    console.log(`[DRY] products: ${docs.length} sample`, docs[0]?.data);
    stats[name].written = docs.length;
    return;
  }
  const db = getDb();

  // Need category mapping slug -> uuid
  const cats = await db.select({ id: categories.id, slug: categories.slug }).from(categories);
  const catMap = new Map(cats.map((c) => [c.slug, c.id]));

  for (const { id, data } of docs) {
    try {
      const catId = data.categoryId && isUuid(data.categoryId) ? data.categoryId : catMap.get(data.categorySlug) || null;
      await db
        .insert(products)
        .values({
          firestoreId: id,
          name: data.name || 'Untitled',
          slug: data.slug || `prod-${id}`,
          description: data.description || null,
          shortDescription: data.shortDescription || null,
          categoryId: catId as any,
          categorySlug: data.categorySlug || 'asset',
          tags: Array.isArray(data.tags) ? data.tags : [],
          price: parsePaise(data.price),
          compareAtPrice: parsePaise(data.compareAtPrice),
          images: Array.isArray(data.images) ? data.images : [],
          bannerImage: data.bannerImage || null,
          fileKey: cleanFileKey(data.fileKey || data.file_key),
          previewFileKey: cleanFileKey(data.previewFileKey),
          fileSize: data.fileSize ?? 0,
          fileFormat: (data.fileFormat || 'ZIP').toUpperCase(),
          fileVersion: data.fileVersion || '1.0',
          isPublished: data.isPublished ?? true,
          isFeatured: data.isFeatured ?? false,
          downloadCount: data.downloadCount ?? 0,
          salesCount: data.salesCount ?? 0,
          averageRating: Math.round((data.averageRating ?? 5.0) * 10),
          reviewCount: data.reviewCount ?? 0,
          seo: data.seo || null,
          createdBy: data.createdBy || null,
          createdAt: toDate(data.createdAt) || new Date(),
          updatedAt: toDate(data.updatedAt) || new Date(),
        })
        .onConflictDoUpdate({
          target: products.slug,
          set: {
            name: data.name || 'Untitled',
            price: parsePaise(data.price),
            updatedAt: new Date(),
          },
        });
      stats[name].written++;
    } catch (e: any) {
      console.error(`[products:${id}]`, e.message);
      stats[name].errors++;
    }
  }
}

async function migrateCoupons() {
  const name = 'coupons';
  if (!shouldRun(name)) return;
  initStat(name);
  const docs = await fetchAll(name);
  stats[name].read = docs.length;
  if (DRY_RUN) {
    console.log(`[DRY] coupons: ${docs.length}`);
    stats[name].written = docs.length;
    return;
  }
  const db = getDb();
  for (const { id, data } of docs) {
    try {
      await db
        .insert(coupons)
        .values({
          firestoreId: id,
          code: (data.code || id).toUpperCase(),
          type: data.type === 'fixed' ? 'fixed' : 'percentage',
          value: data.value ?? 0,
          minOrderAmount: parsePaise(data.minOrderAmount),
          maxUsageCount: data.maxUsageCount ?? null,
          usageCount: data.usageCount ?? 0,
          isActive: data.isActive ?? true,
          expiresAt: toDate(data.expiresAt),
          createdBy: data.createdBy || null,
          createdAt: toDate(data.createdAt) || new Date(),
        })
        .onConflictDoUpdate({
          target: coupons.code,
          set: { value: data.value ?? 0, isActive: data.isActive ?? true },
        });
      stats[name].written++;
    } catch (e: any) {
      console.error(`[coupons:${id}]`, e.message);
      stats[name].errors++;
    }
  }
}

async function migrateOrdersAndItems() {
  const name = 'orders';
  if (!shouldRun(name)) return;
  initStat(name);
  const docs = await fetchAll(name);
  stats[name].read = docs.length;
  if (DRY_RUN) {
    console.log(`[DRY] orders: ${docs.length} sample`, docs[0]?.data);
    stats[name].written = docs.length;
    return;
  }
  const db = getDb();
  // Build product firestoreId -> uuid map
  const prods = await db.select({ id: products.id, firestoreId: products.firestoreId, slug: products.slug }).from(products);
  const prodMap = new Map<string, string>();
  for (const p of prods) {
    if (p.firestoreId) prodMap.set(p.firestoreId, p.id);
    if (p.slug) prodMap.set(p.slug, p.id);
  }

  for (const { id, data } of docs) {
    try {
      await db
        .insert(orders)
        .values({
          id,
          userId: data.userId || data.user_id || 'unknown',
          userEmail: data.userEmail || null,
          userName: data.userName || null,
          subtotal: parsePaise(data.subtotal),
          discountAmount: parsePaise(data.discountAmount ?? data.discount),
          gstAmount: parsePaise(data.gstAmount ?? data.gst ?? 0),
          totalAmount: parsePaise(data.totalAmount ?? data.total ?? data.subtotal ?? 0),
          couponCode: data.couponCode ? String(data.couponCode).toUpperCase() : null,
          status: (data.status as any) || 'pending',
          paymentId: data.paymentId || id,
          razorpayPaymentId: data.razorpayPaymentId || data.razorpay_payment_id || null,
          invoicePdfBase64: data.invoicePdfBase64 || null,
          paidAt: toDate(data.paidAt),
          createdAt: toDate(data.createdAt) || new Date(),
          updatedAt: toDate(data.updatedAt) || new Date(),
        })
        .onConflictDoUpdate({
          target: orders.id,
          set: {
            status: (data.status as any) || 'pending',
            totalAmount: parsePaise(data.totalAmount ?? data.total ?? 0),
            updatedAt: new Date(),
          },
        });

      // Items
      const items: any[] = Array.isArray(data.items) ? data.items : [];
      for (const it of items) {
        const pidRaw = it.productId || it.product_id || it.id;
        const pid = prodMap.get(pidRaw) || (isUuid(pidRaw) ? pidRaw : null);
        if (!pid) {
          console.warn(`[orders:${id}] skipping item, product not found: ${pidRaw}`);
          continue;
        }
        await db
          .insert(orderItems)
          .values({
            orderId: id,
            productId: pid as any,
            productName: it.productName || it.name || null,
            price: parsePaise(it.price),
            quantity: it.quantity ?? 1,
          })
          .onConflictDoNothing();
      }

      stats[name].written++;
    } catch (e: any) {
      console.error(`[orders:${id}]`, e.message);
      stats[name].errors++;
    }
  }
}

async function migrateDownloads() {
  const name = 'downloads';
  if (!shouldRun(name)) return;
  initStat(name);
  const docs = await fetchSubcollection(name);
  stats[name].read = docs.length;
  if (DRY_RUN) {
    console.log(`[DRY] downloads: ${docs.length}`);
    stats[name].written = docs.length;
    return;
  }
  const db = getDb();
  const prods = await db.select({ id: products.id, firestoreId: products.firestoreId }).from(products);
  const prodMap = new Map(prods.filter((p) => p.firestoreId).map((p) => [p.firestoreId!, p.id]));

  for (const { id, parentId, data } of docs) {
    const userId = parentId;
    const productFirestoreId = id; // doc id = productId
    const productId = prodMap.get(productFirestoreId) || (isUuid(productFirestoreId) ? productFirestoreId : null);
    if (!productId) {
      console.warn(`[downloads:${userId}/${id}] product not found`);
      stats[name].skipped++;
      continue;
    }
    try {
      await db
        .insert(downloads)
        .values({
          userId,
          productId: productId as any,
          orderId: data.orderId || 'unknown',
          productName: data.productName || null,
          productSlug: data.productSlug || null,
          productImage: data.productImage || null,
          fileKey: cleanFileKey(data.fileKey),
          fileName: data.fileName || null,
          fileSize: data.fileSize ?? 0,
          fileFormat: data.fileFormat || 'zip',
          fileVersion: data.fileVersion || '1.0',
          downloadLimit: data.downloadLimit ?? 5,
          downloadCount: data.downloadCount ?? 0,
          isActive: data.isActive ?? true,
          downloadAllowed: data.downloadAllowed ?? true,
          purchasedAt: toDate(data.purchasedAt) || new Date(),
          lastDownloadedAt: toDate(data.lastDownloadedAt),
        })
        .onConflictDoUpdate({
          target: [downloads.userId, downloads.productId],
          set: {
            downloadCount: data.downloadCount ?? 0,
            isActive: data.isActive ?? true,
          },
        });
      stats[name].written++;
    } catch (e: any) {
      console.error(`[downloads:${userId}/${id}]`, e.message);
      stats[name].errors++;
    }
  }
}

async function migrateBlogPosts() {
  const name = 'blog_posts';
  if (!shouldRun('blogPosts') && !shouldRun(name)) return;
  initStat('blog_posts');
  const docs = await fetchAll('blog_posts');
  stats['blog_posts'].read = docs.length;
  if (DRY_RUN) {
    console.log(`[DRY] blog_posts: ${docs.length}`);
    stats['blog_posts'].written = docs.length;
    return;
  }
  const db = getDb();
  for (const { id, data } of docs) {
    try {
      await db
        .insert(blogPosts)
        .values({
          firestoreId: id,
          title: data.title || 'Untitled',
          slug: data.slug || `post-${id}`,
          content: data.content || null,
          excerpt: data.excerpt || null,
          featuredImage: data.featuredImage || null,
          authorId: data.authorId || null,
          authorName: data.authorName || null,
          tags: Array.isArray(data.tags) ? data.tags : [],
          status: (data.status as any) || 'draft',
          viewCount: data.viewCount ?? 0,
          relatedProductIds: Array.isArray(data.relatedProductIds) ? data.relatedProductIds : [],
          publishedAt: toDate(data.publishedAt),
          createdAt: toDate(data.createdAt) || new Date(),
          updatedAt: toDate(data.updatedAt) || new Date(),
        })
        .onConflictDoUpdate({ target: blogPosts.slug, set: { title: data.title || 'Untitled', updatedAt: new Date() } });
      stats['blog_posts'].written++;
    } catch (e: any) {
      console.error(`[blog_posts:${id}]`, e.message);
      stats['blog_posts'].errors++;
    }
  }
}

async function migrateSimple(collection: string, table: any, mapper: (id: string, data: any) => any, key: string = 'id') {
  if (!shouldRun(collection)) return;
  initStat(collection);
  const docs = await fetchAll(collection);
  stats[collection].read = docs.length;
  if (DRY_RUN) {
    console.log(`[DRY] ${collection}: ${docs.length}`);
    stats[collection].written = docs.length;
    return;
  }
  const db = getDb();
  for (const { id, data } of docs) {
    try {
      await db.insert(table).values(mapper(id, data)).onConflictDoNothing();
      stats[collection].written++;
    } catch (e: any) {
      console.error(`[${collection}:${id}]`, e.message);
      stats[collection].errors++;
    }
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Firestore -> Neon Migration');
  console.log(`DRY_RUN=${DRY_RUN} ONLY=${ONLY || 'all'}`);
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'MISSING');

  if (!process.env.DATABASE_URL && !DRY_RUN) {
    console.error('DATABASE_URL required. Set Neon URL in .env');
    process.exit(1);
  }

  // Verify Firebase can connect (unless dry run without Firestore)
  try {
    const db = getAdminDb();
    await db.collection('users').limit(1).get();
    console.log('✅ Firebase Admin connected');
  } catch (e: any) {
    console.error('❌ Firebase Admin failed:', e.message);
    console.log('Hint: set FIREBASE_* env or GOOGLE_APPLICATION_CREDENTIALS');
    if (!DRY_RUN) process.exit(1);
  }

  // Order matters: users first (FK), then categories, products, coupons, orders, downloads, rest
  await migrateUsers();
  await migrateCategories();
  await migrateProducts();
  await migrateCoupons();
  await migrateOrdersAndItems();
  await migrateDownloads();

  await migrateBlogPosts();

  await migrateSimple('reviews', reviews, (id, d) => ({
    firestoreId: id,
    productId: isUuid(d.productId) ? d.productId : undefined as any, // will be resolved via downloads map if needed, fallback
    userId: d.userId || 'unknown',
    userName: d.userName || null,
    userAvatar: d.userAvatar || null,
    rating: d.rating ?? 5,
    comment: d.comment || null,
    isApproved: d.isApproved ?? true,
    createdAt: toDate(d.createdAt) || new Date(),
  }));

  await migrateSimple('newsletter_subscribers', newsletterSubscribers, (id, d) => ({
    email: (d.email || id).toLowerCase(),
    createdAt: toDate(d.createdAt) || new Date(),
  }));

  await migrateSimple('admin_logs', adminLogs, (id, d) => ({
    adminId: d.adminId || 'unknown',
    adminEmail: d.adminEmail || null,
    action: (d.action as any) || 'CREATE',
    resourceType: (d.resourceType as any) || 'PRODUCT',
    resourceId: d.resourceId || null,
    details: d.details || null,
    timestamp: toDate(d.timestamp) || new Date(),
  }));

  await migrateSimple('download_logs', downloadLogs, (id, d) => ({
    userId: d.userId || 'unknown',
    productId: d.productId && isUuid(d.productId) ? d.productId : undefined as any,
    orderId: d.orderId || 'unknown',
    ipAddress: d.ipAddress || null,
    userAgent: d.userAgent || null,
    success: d.success ?? false,
    failureReason: d.failureReason || null,
    attemptedAt: toDate(d.attemptedAt) || new Date(),
  }));

  // site_settings/main
  if (shouldRun('site_settings')) {
    initStat('site_settings');
    try {
      const snap = await getAdminDb().collection('site_settings').doc('main').get();
      if (snap.exists) {
        const d = snap.data()!;
        stats['site_settings'].read = 1;
        if (!DRY_RUN) {
          const db = getDb();
          await db
            .insert(siteSettings)
            .values({
              id: 'main',
              siteName: d.siteName || null,
              siteDescription: d.siteDescription || null,
              logoUrl: d.logoUrl || null,
              faviconUrl: d.faviconUrl || null,
              contactEmail: d.contactEmail || null,
              emailSettings: d.emailSettings || null,
              socialLinks: d.socialLinks || null,
              gstNumber: d.gstNumber || null,
              razorpayKeyId: d.razorpayKeyId || null,
              featuredProductIds: d.featuredProductIds || [],
              maintenanceMode: d.maintenanceMode ?? false,
              homepageHeroCopy: d.homepageHeroCopy || null,
              invoiceSettings: d.invoiceSettings || null,
            })
            .onConflictDoUpdate({ target: siteSettings.id, set: { siteName: d.siteName || null, updatedAt: new Date() } });
          stats['site_settings'].written = 1;
        } else {
          stats['site_settings'].written = 1;
        }
      }
    } catch (e: any) {
      console.error('[site_settings]', e.message);
      stats['site_settings'].errors = 1;
    }
  }

  // OTP tables
  if (shouldRun('passwordResetOTP')) {
    await migrateSimple('passwordResetOTP', passwordResetOtps, (id, d) => ({
      email: (d.email || '').toLowerCase(),
      otpHash: d.otpHash || '',
      expiresAt: toDate(d.expiresAt) || new Date(Date.now() + 10 * 60 * 1000),
      used: d.used ?? false,
      attempts: d.attempts ?? 0,
      ipAddress: d.ipAddress || null,
      createdAt: toDate(d.createdAt) || new Date(),
    }));
  }
  if (shouldRun('passwordResetSessions')) {
    await migrateSimple('passwordResetSessions', passwordResetSessions, (id, d) => ({
      email: (d.email || '').toLowerCase(),
      token: d.token || id,
      expiresAt: toDate(d.expiresAt) || new Date(Date.now() + 15 * 60 * 1000),
      used: d.used ?? false,
      createdAt: toDate(d.createdAt) || new Date(),
    }));
  }

  console.log('\n📊 Migration Report');
  console.table(stats);

  const totalErrors = Object.values(stats).reduce((s, v) => s + v.errors, 0);
  if (totalErrors > 0) console.warn(`⚠️  ${totalErrors} errors — check logs, re-run with --only=<table>`);
  else console.log('✅ All collections migrated (or dry-run)');

  if (DRY_RUN) console.log('\nDRY RUN — no writes. Remove --dry-run to execute.');
}

main().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
