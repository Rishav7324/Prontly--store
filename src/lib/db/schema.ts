/**
 * @fileOverview Neon Postgres Schema for Prontly Store — Firestore -> SQL
 * Covers all 11 Firestore collections + 2 OTP session tables.
 * Price stored in paise (int) to avoid float errors — same as Firestore.
 */

import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uuid,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─────────────────────────── USERS ───────────────────────────
export const users = pgTable(
  'users',
  {
    uid: text('uid').primaryKey(), // Firebase Auth UID = PK
    email: text('email').notNull().unique(),
    displayName: text('display_name'),
    photoUrl: text('photo_url'),
    role: text('role', { enum: ['customer', 'editor', 'admin', 'super-admin'] })
      .notNull()
      .default('customer'),
    phone: text('phone'),
    gstNumber: text('gst_number'),
    language: text('language', { enum: ['en', 'hi'] }).default('en'),
    isActive: boolean('is_active').default(true),
    totalSpent: integer('total_spent').default(0).notNull(), // paise
    orderCount: integer('order_count').default(0).notNull(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    lastPurchaseAt: timestamp('last_purchase_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('users_email_idx').on(t.email), index('users_role_idx').on(t.role)]
);

// ─────────────────────────── CATEGORIES ───────────────────────────
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    iconEmoji: text('icon_emoji').default('📦'),
    bannerImage: text('banner_image'),
    productCount: integer('product_count').default(0),
    isActive: boolean('is_active').default(true),
    seo: jsonb('seo'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('categories_slug_idx').on(t.slug)]
);

// ─────────────────────────── PRODUCTS ───────────────────────────
export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Keep original Firestore doc ID for migration traceability
    firestoreId: text('firestore_id').unique(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'), // HTML
    shortDescription: text('short_description'),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    categorySlug: text('category_slug').default('asset'),
    tags: jsonb('tags').$type<string[]>().default(sql`'[]'::jsonb`),
    price: integer('price').notNull().default(0), // paise
    compareAtPrice: integer('compare_at_price').default(0),
    images: jsonb('images').$type<string[]>().default(sql`'[]'::jsonb`),
    bannerImage: text('banner_image'),
    fileKey: text('file_key'), // R2 relative key, e.g. products/files/...
    previewFileKey: text('preview_file_key'),
    fileSize: integer('file_size').default(0),
    fileFormat: text('file_format').default('ZIP'),
    fileVersion: text('file_version').default('1.0'),
    isPublished: boolean('is_published').default(true),
    isFeatured: boolean('is_featured').default(false),
    downloadCount: integer('download_count').default(0),
    salesCount: integer('sales_count').default(0),
    averageRating: integer('average_rating').default(50), // store as 0-50 (5.0*10) to avoid float
    reviewCount: integer('review_count').default(0),
    seo: jsonb('seo'),
    createdBy: text('created_by').references(() => users.uid),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('products_slug_idx').on(t.slug),
    index('products_category_slug_idx').on(t.categorySlug),
    index('products_is_published_idx').on(t.isPublished),
    index('products_sales_count_idx').on(t.salesCount),
  ]
);

// ─────────────────────────── REVIEWS ───────────────────────────
export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    firestoreId: text('firestore_id').unique(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    userName: text('user_name'),
    userAvatar: text('user_avatar'),
    rating: integer('rating').notNull(), // 1-5
    comment: text('comment'),
    isApproved: boolean('is_approved').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('reviews_product_id_idx').on(t.productId),
    index('reviews_user_id_idx').on(t.userId),
  ]
);

// ─────────────────────────── COUPONS ───────────────────────────
export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    firestoreId: text('firestore_id').unique(),
    code: text('code').notNull().unique(), // stored UPPER
    type: text('type', { enum: ['percentage', 'fixed'] }).notNull().default('percentage'),
    value: integer('value').notNull().default(0), // % or paise
    minOrderAmount: integer('min_order_amount').default(0), // paise
    maxUsageCount: integer('max_usage_count'), // null = unlimited
    usageCount: integer('usage_count').default(0).notNull(),
    isActive: boolean('is_active').default(true),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdBy: text('created_by').references(() => users.uid),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('coupons_code_idx').on(t.code)]
);

// ─────────────────────────── ORDERS ───────────────────────────
export const orders = pgTable(
  'orders',
  {
    id: text('id').primaryKey(), // Razorpay orderId
    userId: text('user_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    userEmail: text('user_email'),
    userName: text('user_name'),
    subtotal: integer('subtotal').notNull().default(0), // paise
    discountAmount: integer('discount_amount').default(0),
    gstAmount: integer('gst_amount').default(0),
    totalAmount: integer('total_amount').notNull().default(0), // paise
    couponCode: text('coupon_code'),
    status: text('status', {
      enum: ['pending', 'paid', 'delivered', 'refunded', 'failed'],
    })
      .notNull()
      .default('pending'),
    paymentId: text('payment_id'), // Razorpay orderId alias / paymentId after paid
    razorpayPaymentId: text('razorpay_payment_id'),
    paymentSignature: text('payment_signature'),
    gstNumber: text('gst_number'),
    invoiceUrl: text('invoice_url'),
    invoicePdfBase64: text('invoice_pdf_base64'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('orders_user_id_idx').on(t.userId),
    index('orders_status_idx').on(t.status),
    index('orders_created_at_idx').on(t.createdAt),
  ]
);

// ─────────────────────────── ORDER ITEMS (normalized from Firestore items array) ───────────────────────────
export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    productName: text('product_name'),
    price: integer('price').notNull(), // paise snapshot
    quantity: integer('quantity').notNull().default(1),
  },
  (t) => [index('order_items_order_id_idx').on(t.orderId)]
);

// ─────────────────────────── DOWNLOADS (flattened subcollection) ───────────────────────────
export const downloads = pgTable(
  'downloads',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.uid, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productName: text('product_name'),
    productSlug: text('product_slug'),
    productImage: text('product_image'),
    fileKey: text('file_key'), // never expose to client, used for signed URL
    fileName: text('file_name'),
    fileSize: integer('file_size').default(0),
    fileFormat: text('file_format').default('zip'),
    fileVersion: text('file_version').default('1.0'),
    downloadLimit: integer('download_limit').default(5).notNull(),
    downloadCount: integer('download_count').default(0).notNull(),
    isActive: boolean('is_active').default(true),
    downloadAllowed: boolean('download_allowed').default(true),
    purchasedAt: timestamp('purchased_at', { withTimezone: true }).defaultNow().notNull(),
    lastDownloadedAt: timestamp('last_downloaded_at', { withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.productId] }),
    index('downloads_user_id_idx').on(t.userId),
    index('downloads_order_id_idx').on(t.orderId),
  ]
);

// ─────────────────────────── DOWNLOAD LOGS ───────────────────────────
export const downloadLogs = pgTable(
  'download_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    productId: uuid('product_id').notNull(),
    orderId: text('order_id').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    success: boolean('success').notNull(),
    failureReason: text('failure_reason'),
    signedUrlExpiry: timestamp('signed_url_expiry', { withTimezone: true }),
    attemptedAt: timestamp('attempted_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('download_logs_user_id_idx').on(t.userId),
    index('download_logs_product_id_idx').on(t.productId),
  ]
);

// ─────────────────────────── BLOG POSTS ───────────────────────────
export const blogPosts = pgTable(
  'blog_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    firestoreId: text('firestore_id').unique(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    content: text('content'),
    excerpt: text('excerpt'),
    featuredImage: text('featured_image'),
    authorId: text('author_id').references(() => users.uid),
    authorName: text('author_name'),
    tags: jsonb('tags').$type<string[]>().default(sql`'[]'::jsonb`),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    status: text('status', { enum: ['draft', 'published', 'scheduled'] }).default('draft'),
    viewCount: integer('view_count').default(0),
    relatedProductIds: jsonb('related_product_ids').$type<string[]>().default(sql`'[]'::jsonb`),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('blog_posts_slug_idx').on(t.slug), index('blog_posts_status_idx').on(t.status)]
);

// ─────────────────────────── ADMIN LOGS ───────────────────────────
export const adminLogs = pgTable(
  'admin_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    adminId: text('admin_id').notNull(),
    adminEmail: text('admin_email'),
    action: text('action', { enum: ['CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'UNPUBLISH'] }).notNull(),
    resourceType: text('resource_type', {
      enum: ['PRODUCT', 'CATEGORY', 'COUPON', 'BLOG_POST', 'SETTINGS', 'ORDER', 'USER'],
    }).notNull(),
    resourceId: text('resource_id'),
    details: jsonb('details'),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('admin_logs_admin_id_idx').on(t.adminId),
    index('admin_logs_resource_type_idx').on(t.resourceType),
    index('admin_logs_timestamp_idx').on(t.timestamp),
  ]
);

// ─────────────────────────── SITE SETTINGS (single row) ───────────────────────────
export const siteSettings = pgTable('site_settings', {
  id: text('id').primaryKey().default('main'),
  siteName: text('site_name'),
  siteDescription: text('site_description'),
  logoUrl: text('logo_url'),
  faviconUrl: text('favicon_url'),
  contactEmail: text('contact_email'),
  emailSettings: jsonb('email_settings'),
  socialLinks: jsonb('social_links'),
  gstNumber: text('gst_number'),
  razorpayKeyId: text('razorpay_key_id'),
  featuredProductIds: jsonb('featured_product_ids').$type<string[]>().default(sql`'[]'::jsonb`),
  maintenanceMode: boolean('maintenance_mode').default(false),
  homepageHeroCopy: jsonb('homepage_hero_copy'),
  invoiceSettings: jsonb('invoice_settings'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────── NEWSLETTER ───────────────────────────
export const newsletterSubscribers = pgTable(
  'newsletter_subscribers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('newsletter_email_idx').on(t.email)]
);

// ─────────────────────────── ANALYTICS ───────────────────────────
export const analytics = pgTable('analytics', {
  id: text('id').primaryKey().default('global'),
  totalRevenue: integer('total_revenue').default(0).notNull(), // paise
  totalOrders: integer('total_orders').default(0).notNull(),
  lastUpdatedAt: timestamp('last_updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─────────────────────────── PASSWORD RESET (OTP flow) ───────────────────────────
export const passwordResetOtps = pgTable(
  'password_reset_otps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    otpHash: text('otp_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    used: boolean('used').default(false).notNull(),
    attempts: integer('attempts').default(0).notNull(),
    ipAddress: text('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('password_reset_otps_email_idx').on(t.email), index('password_reset_otps_created_at_idx').on(t.createdAt)]
);

export const passwordResetSessions = pgTable(
  'password_reset_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    used: boolean('used').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('password_reset_sessions_email_idx').on(t.email)]
);

// ─────────────────────────── EMAIL EVENTS (for webhooks) ───────────────────────────
export const emailEvents = pgTable('email_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email'),
  event: text('event'),
  payload: jsonb('payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
