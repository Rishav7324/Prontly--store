# Firestore → Neon SQL Migration — Complete Guide

> Data intact, zero loss. Dual-mode: App works with Firestore if `DATABASE_URL` missing, switches to SQL when set.

## 1. Kya Hua Hai (Build Mode Completed)

### Naye Files
| File | Purpose |
|---|---|
| `drizzle.config.ts` | Drizzle Kit config (Neon Postgres) |
| `src/lib/db/schema.ts` | 14 tables: `users, categories, products, reviews, coupons, orders, order_items, downloads, download_logs, blog_posts, admin_logs, site_settings, newsletter_subscribers, analytics, password_reset_* , email_events` — price paise int, `isPublished` guard, coupon expiry+usage+minOrder |
| `src/lib/db/index.ts` | `getDb()` (Neon HTTP) + `getPgDb()` (Pool for transactions), `isDatabaseConfigured()` guard |
| `src/lib/db/downloads.ts` | SQL replacement for `src/lib/firebase/downloads.ts` — same function names |
| `src/lib/db/admin-logs.ts` | SQL admin logs |
| `src/lib/db/helpers.ts` | `normalizeProduct`, `getProductBySlugSql` |
| `src/lib/auth/verify.ts` | Firebase token verify + Neon role check |
| `src/hooks/useSqlCollection.ts` | TanStack Query SWR for SQL (`/api/products`) — polls 10s to mimic `onSnapshot` |
| `src/app/api/products/route.ts` | SQL-first products API |
| `src/app/api/categories/route.ts` | SQL-first categories API |
| `src/app/api/reviews/route.ts` | SQL-first reviews API |
| `src/app/api/admin/logs/route.ts` | Dual POST/GET logs |
| `scripts/migrate-firestore-to-neon.ts` | **ETL — Firestore → Neon**, `fileKey` normalize, `Timestamp` → Date, idempotency via `firestore_id` + `onConflictDoUpdate` |
| `scripts/verify-migration.ts` | Count + revenue verification |
| `.env.example` | Updated with `DATABASE_URL` |

### Modified Files (Dual-Mode — SQL first, Firestore fallback)
- `src/app/api/razorpay/create-order/route.ts:14` — coupon `expiresAt`, `maxUsageCount`, `minOrderAmount`, `isPublished` checks, `order_items` insert, `DATABASE_URL` guard
- `src/app/api/razorpay/verify/route.ts:14` — pg Pool `transaction`, `downloads` upsert, `users`/`analytics` increment
- `src/app/api/razorpay/webhook/route.ts:14` — same
- `src/app/api/downloads/generate-url/route.ts:14` — dynamic import `lib/db/downloads` vs `lib/firebase/downloads`
- `src/app/api/user/downloads/route.ts:14` — same
- `src/app/api/auth/request-reset-otp/route.ts:14`, `verify-reset-otp:14`, `reset-password:14` — SQL tables `password_reset_*`
- `src/app/sitemap.ts:14` — Neon select if configured
- `src/app/page.tsx:14` — homepage `getHomeData()` Neon first
- `src/app/products/[slug]/page.tsx:14` — `getProductBySlug` Neon first
- `src/lib/admin-logs.ts:14` — dual client log via `/api/admin/logs`
- `package.json` — added `drizzle-orm`, `pg`, `@neondatabase/serverless`, `ws`, `drizzle-kit`, `tsx`, `@types/pg`, `@types/ws` + scripts `db:*`, `migrate:*`

### Behavior
- **Without `DATABASE_URL`**: App 100% Firestore jaisa chalta hai — koi break nahi.
- **With `DATABASE_URL`**: SQL path active, `isDatabaseConfigured()` true.

## 2. Neon Setup (5 min)

1. **Neon project banao:** https://console.neon.tech → Create Project → Region `aws-ap-south-1` (India) recommended.
2. **Connection string copy:** Dashboard → Connection Details → `DATABASE_URL` (pooled).
3. **`.env.local` me add karo:**
   ```
   DATABASE_URL=postgres://user:pass@ep-xxx.ap-south-1.aws.neon.tech/neondb?sslmode=require
   ```
   (Keep existing `FIREBASE_*`, `RAZORPAY_*`, `R2_*` as is — Auth still Firebase)

4. **Install deps (if npm ENOTEMPTY error aaye):**
   ```bash
   rm -rf node_modules/.cache node_modules/.drizzle* node_modules/.fast* node_modules/.genkit* 2>/dev/null
   npm install --legacy-peer-deps
   # ya
   npm install --force
   ```

## 3. Schema Push (1 min)

```bash
# Drizzle generate + push to Neon
npm run db:push
# ya manual
npx drizzle-kit push

# Verify tables:
npx drizzle-kit studio # opens Drizzle Studio
# ya psql
psql $DATABASE_URL -c "\dt"
```

14 tables + indexes ban jayenge (`schema.ts:1`).

## 4. Data Migration — Purana Data Intact (2 min)

```bash
# Dry-run first (no writes):
DATABASE_URL=$DATABASE_URL npm run migrate:firestore-to-neon -- --dry-run

# Full migrate (all collections):
DATABASE_URL=$DATABASE_URL npm run migrate:firestore-to-neon

# Only specific tables (after fix):
DATABASE_URL=$DATABASE_URL npm run migrate:firestore-to-neon -- --only=products,orders

# Verify counts & revenue match:
DATABASE_URL=$DATABASE_URL npm run migrate:verify
```

**ETL details:** `scripts/migrate-firestore-to-neon.ts:1`
- Reads Firestore via `firebase-admin` (`FIREBASE_*` env needed)
- `Timestamp.toDate()` → `timestamptz`, `fileKey` full URL `https://cdn.prontly.in/products/files/...` → relative `products/files/...`
- `products.averageRating` float → int `*10` (store 50 = 5.0)
- Idempotent: re-run safe, `ON CONFLICT DO UPDATE` on `slug`, `code`, `firestore_id`

Expected output:
```
✅ users: 123
✅ products: 45
✅ orders: 67 ...
📊 Migration Report table
```

## 5. Test Locally

```bash
npm run dev # -p 9002
# Without DATABASE_URL: Firestore path — should work as before
# With DATABASE_URL: SQL path — test:
# - Homepage loads from Neon
# - /products/[slug] loads from Neon
# - Create order (Razorpay test) → verify → downloads table populated
# - /dashboard/downloads shows Neon downloads
```

Test checkout flow:
1. `FIREBASE_*` + `DATABASE_URL` set
2. Add to cart → Checkout → Razorpay test card `4111 1111 1111 1111`
3. `verify` should insert into `downloads` + `users.totalSpent`

## 6. Admin Pages — Incremental SQL Migration

**Naye SQL APIs ready hain:** `/api/products`, `/api/categories`, `/api/reviews?productId=`.

**Pattern for admin pages (example):**
```tsx
// Before (Firestore):
import { useCollection, useFirestore } from '@/firebase';
const { data } = useCollection(query(collection(db,'products')));

// After (SQL):
import { useSqlCollection } from '@/hooks/useSqlCollection';
const { data, loading } = useSqlCollection('/api/products'); // SWR polls 10s
```

Remaining admin pages (`admin/products/page.tsx:4`, `admin/orders`, `admin/users`, `admin/categories`, etc.) same pattern se migrate karo — ek-ek karke. Docs me helper `src/lib/db/helpers.ts` hai.

## 7. Cutover Checklist (Prod)

- [ ] `npm run db:push` prod Neon branch pe
- [ ] `npm run migrate:firestore-to-neon` prod data
- [ ] `npm run migrate:verify` — counts ✅
- [ ] Maintenance mode `site_settings.maintenanceMode=true` 10 min
- [ ] Final delta migrate (last 1hr): `npm run migrate:firestore-to-neon -- --only=orders,downloads,users`
- [ ] Set `DATABASE_URL` in prod env (Vercel/Firebase App Hosting → env vars)
- [ ] Deploy
- [ ] Test live checkout + download signed URL
- [ ] Keep Firestore 30 days as backup, then `firestore.rules` lock `allow read,write: if false`

## 8. Rollback

If SQL fails: **Remove `DATABASE_URL` env** and redeploy — app auto falls back to Firestore (dual-mode). No code change.

## 9. Known Gaps (TODO for full 100% SQL)

- Admin CRUD writes (`ProductForm.tsx:179 setDoc`, `admin/categories` `addDoc/updateDoc`, `admin/blog` etc.) abhi Firestore SDK use karte hai — inko `/api/admin/products` POST/PUT pe migrate karna baki hai (pattern ready, ek example bana sakte ho).
- `src/components/store/ReviewSystem.tsx:113 addDoc` — `/api/reviews` POST banana baki.
- `src/app/dashboard/page.tsx:50` `useCollection(orders)` — `/api/user/orders` SQL API banana baki (easy).

In sab ke liye `src/app/api/*` + `useSqlCollection` pattern follow karo — 1-2 din me pura admin SQL ho jayega.

## 10. Scripts Reference

```bash
npm run db:generate   # drizzle-kit generate migrations to ./drizzle
npm run db:migrate    # run migrations
npm run db:push       # push schema directly (dev)
npm run db:studio     # open Drizzle Studio GUI
npm run migrate:firestore-to-neon -- --dry-run --only=products
npm run migrate:verify
npm run typecheck     # tsc --noEmit
```

Need help? Share `DATABASE_URL` (masked) + `npm run migrate:verify` output.
