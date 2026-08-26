import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth/verify';
import { createRazorpayOrder } from '@/lib/razorpay/client';
import { calculatePriceBreakdown } from '@/lib/payment/gst';
import { getDb } from '@/lib/db';
import { products, coupons, orders, orderItems, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * API: Initialize Payment Process
 * Creates a Razorpay order and logs a pending intent in Firestore.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate User
    const decoded = await verifyAuthToken(req.headers.get('authorization'));
    const uid = decoded.uid;

    const body = await req.json();
    const { items, couponCode } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
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

    // 5. Create Razorpay Order
    const razorpayOrder = await createRazorpayOrder({
      amount: breakdown.total,
      receipt: `order_${Date.now()}`,
      notes: { userId: uid, appName: "prontly-store" }
    });

    // 6. Log Pending Intent — SQL if configured, else Firestore
    if (isDatabaseConfigured()) {
      const db = getDb();
      // Ensure user exists in Neon (FK)
      const [existingUser] = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      if (!existingUser) {
        await db.insert(users).values({
          uid,
          email: (decoded.email || `${uid}@unknown.local`).toLowerCase(),
          displayName: decoded.name || 'User',
          role: 'customer',
        }).onConflictDoNothing();
      }
      await db.insert(orders).values({
        id: razorpayOrder.id,
        userId: uid,
        userEmail: decoded.email || '',
        userName: decoded.name || 'User',
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
