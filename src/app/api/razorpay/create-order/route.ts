import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { createRazorpayOrder } from '@/lib/razorpay/client';
import { calculatePriceBreakdown } from '@/lib/payment/gst';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * API: Initialize Payment Process
 * Creates a Razorpay order and logs a pending intent in Firestore.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate User
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") ?? "";
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(token);
    const uid = decoded.uid;

    const body = await req.json();
    const { items, couponCode } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const db = getAdminDb();

    // 2. Fetch products and calculate real subtotal to prevent tampering
    let subtotal = 0;
    const cartItems = [];

    for (const item of items) {
      const productSnap = await db.collection('products').doc(item.id).get();
      if (!productSnap.exists) continue;
      
      const product = productSnap.data()!;
      const price = product.price || 0; // Expected in paise
      subtotal += price * (item.quantity || 1);
      
      cartItems.push({
        productId: item.id,
        productName: product.name,
        price: price,
        quantity: item.quantity || 1
      });
    }

    // 3. Handle Coupon (Optional)
    let discount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const couponSnap = await db.collection('coupons')
        .where('code', '==', couponCode.toUpperCase())
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (!couponSnap.empty) {
        const coupon = couponSnap.docs[0].data();
        discount = coupon.type === 'percentage' 
          ? Math.round((subtotal * (coupon.value || 0)) / 100) 
          : (coupon.value || 0);
        appliedCoupon = couponCode.toUpperCase();
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

    // 6. Log Pending Intent in Firestore
    await db.collection('orders').doc(razorpayOrder.id).set({
      userId: uid,
      userEmail: decoded.email || '',
      userName: decoded.name || 'User',
      items: cartItems,
      subtotal: breakdown.subtotal,
      discountAmount: breakdown.discount,
      gstAmount: 0,
      totalAmount: breakdown.total,
      couponCode: appliedCoupon,
      status: 'pending',
      createdAt: Timestamp.now(),
      paymentId: razorpayOrder.id
    });

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
