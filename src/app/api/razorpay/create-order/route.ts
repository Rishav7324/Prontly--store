import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';
import { createRazorpayOrder } from '@/lib/razorpay/client';
import { calculateGST } from '@/lib/payment/gst';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

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
      const price = product.price;
      subtotal += price * item.quantity;
      
      cartItems.push({
        productId: item.id,
        productName: product.name,
        price: price,
        quantity: item.quantity
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
          ? (subtotal * coupon.value) / 100 
          : coupon.value;
        appliedCoupon = couponCode.toUpperCase();
      }
    }

    // 4. Calculate Final Financials
    const breakdown = calculateGST({ subtotal, discountAmount: discount });

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
      gstAmount: breakdown.gst,
      totalAmount: breakdown.total,
      couponCode: appliedCoupon,
      status: 'pending',
      createdAt: Timestamp.now(),
      paymentId: razorpayOrder.id // Mapping RP Order ID
    });

    return NextResponse.json({
      success: true,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      breakdown
    });

  } catch (error: any) {
    console.error('[CREATE_ORDER_ERROR]:', error.message);
    return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 });
  }
}
