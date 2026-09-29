import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth/verify';
import { createRazorpayOrder } from '@/lib/razorpay/client';
import { calculatePriceBreakdown } from '@/lib/payment/gst';
import { getDb, isDatabaseConfigured } from '@/lib/db';
import { products, coupons, orders, orderItems, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

import crypto from 'crypto';

/**
 * API: Initialize Payment Process
 * Supports both Authenticated Users and 1-Step Guest Checkout (Email + Mobile).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, couponCode, guest } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // 1. Resolve User Identity: Authenticated Session OR Guest Checkout
    let uid = '';
    let email = '';
    let name = 'Creator';
    let phone = '';
    let isGuest = false;

    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = await verifyAuthToken(authHeader);
        uid = decoded.uid;
        email = (decoded.email || '').toLowerCase();
        name = decoded.name || email.split('@')[0] || 'Creator';
      } catch (authErr) {
        console.warn('[CREATE_ORDER_AUTH_WARN]:', authErr);
      }
    }

    if (!uid) {
      // Check for Guest Checkout Details
      if (!guest || !guest.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) {
        return NextResponse.json(
          { error: 'A valid email address is required for instant order delivery.' },
          { status: 400 }
        );
      }

      const cleanPhone = (guest.phone || '').replace(/[^\d+]/g, '');
      if (!cleanPhone || cleanPhone.length < 8) {
        return NextResponse.json(
          { error: 'A valid mobile number is required for instant fulfillment confirmation.' },
          { status: 400 }
        );
      }

      isGuest = true;
      email = guest.email.trim().toLowerCase();
      phone = cleanPhone;
      name = (guest.name || email.split('@')[0] || 'Creator').trim();
    }

    // 2 & 3: Try SQL first, fallback to Firestore if DATABASE_URL not set
    let subtotal = 0;
    const cartItems: any[] = [];
    let discount = 0;
    let appliedCoupon: string | null = null;

    if (isDatabaseConfigured()) {
      const db = getDb();
      for (const item of items) {
        const [product] = await db.select().from(products).where(eq(products.id, item.id)).limit(1);
        // Fallback: try firestoreId or slug if uuid not found
        let prod = product;
        if (!prod) {
          const [byFid] = await db.select().from(products).where(eq(products.firestoreId, item.id)).limit(1);
          prod = byFid;
        }
        if (!prod) continue;
        const price = prod.price || 0;
        if (!prod.isPublished) continue; // block unpublished assets
        subtotal += price * (item.quantity || 1);
        cartItems.push({ productId: prod.id, productName: prod.name, price, quantity: item.quantity || 1 });
      }

      if (couponCode) {
        const codeUpper = couponCode.toUpperCase();
        const [coupon] = await db
          .select()
          .from(coupons)
          .where(and(eq(coupons.code, codeUpper), eq(coupons.isActive, true)))
          .limit(1);
        if (coupon) {
          // Expiry + usage check
          const now = new Date();
          const expired = coupon.expiresAt ? coupon.expiresAt < now : false;
          const maxed = coupon.maxUsageCount ? (coupon.usageCount ?? 0) >= coupon.maxUsageCount : false;
          const minOk = coupon.minOrderAmount ? subtotal >= coupon.minOrderAmount : true;
          if (!expired && !maxed && minOk) {
            discount = coupon.type === 'percentage'
              ? Math.round((subtotal * (coupon.value || 0)) / 100)
              : coupon.value || 0;
            appliedCoupon = codeUpper;
          }
        }
      }
    }

    // 4. Calculate Final Financials
    const breakdown = calculatePriceBreakdown({ subtotal, discountAmount: discount });

    // Razorpay minimum amount is 100 paise (₹1)
    if (breakdown.total < 100) {
      return NextResponse.json({ error: 'Minimum transaction amount is ₹1.' }, { status: 400 });
    }

    // 5. User Resolution in Neon DB (FK requirement)
    if (isDatabaseConfigured()) {
      const db = getDb();
      if (!uid) {
        // Find existing user by email
        const [byEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (byEmail) {
          uid = byEmail.uid;
          if (phone && !byEmail.phone) {
            await db.update(users).set({ phone }).where(eq(users.uid, uid));
          }
        } else {
          uid = `usr_${crypto.randomBytes(12).toString('hex')}`;
          await db.insert(users).values({
            uid,
            email,
            displayName: name,
            phone: phone || null,
            role: 'customer',
          }).onConflictDoNothing();
        }
      } else {
        const [existingUser] = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
        if (!existingUser) {
          await db.insert(users).values({
            uid,
            email: (email || `${uid}@unknown.local`).toLowerCase(),
            displayName: name,
            phone: phone || null,
            role: 'customer',
          }).onConflictDoNothing();
        } else if (phone && !existingUser.phone) {
          await db.update(users).set({ phone }).where(eq(users.uid, uid));
        }
      }
    }

    if (!uid) {
      uid = `usr_${crypto.randomBytes(12).toString('hex')}`;
    }

    // 6. Create Razorpay Order with Guest & User Notes
    const razorpayOrder = await createRazorpayOrder({
      amount: breakdown.total,
      receipt: `order_${Date.now()}`,
      notes: {
        userId: uid,
        userEmail: email,
        userPhone: phone || '',
        userName: name,
        isGuest: isGuest ? 'true' : 'false',
        appName: "prontly-store",
      },
    });

    // 7. Log Pending Intent in Database
    if (isDatabaseConfigured()) {
      const db = getDb();
      await db.insert(orders).values({
        id: razorpayOrder.id,
        userId: uid,
        userEmail: email,
        userName: name,
        subtotal: breakdown.subtotal,
        discountAmount: breakdown.discount,
        gstAmount: 0,
        totalAmount: breakdown.total,
        couponCode: appliedCoupon,
        status: 'pending',
        paymentId: razorpayOrder.id,
      });
      for (const ci of cartItems) {
        await db.insert(orderItems).values({
          orderId: razorpayOrder.id,
          productId: ci.productId as any,
          productName: ci.productName,
          price: ci.price,
          quantity: ci.quantity,
        });
      }
      // Increment coupon usage if applied
      if (appliedCoupon) {
        const [c] = await db.select().from(coupons).where(eq(coupons.code, appliedCoupon)).limit(1);
        if (c) await db.update(coupons).set({ usageCount: (c.usageCount ?? 0) + 1 }).where(eq(coupons.id, c.id));
      }
    }

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      breakdown
    });

  } catch (error: any) {
    console.error('[CREATE_ORDER_ERROR]:', error.message);
    return NextResponse.json({ error: 'Failed to initialize payment gateway' }, { status: 500 });
  }
}
