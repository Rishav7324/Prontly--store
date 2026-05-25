import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import { sendOrderConfirmationEmail } from '@/app/actions/email-actions';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

/**
 * ─── ROBUST PURCHASE FULFILLMENT ENGINE ──────────────────────────────────────
 * Implements a global Firestore Transaction to ensure data integrity.
 * Updates: Orders, Users (Aggregates), Downloads, and Analytics atomically.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[WEBHOOK_CONFIG_ERROR]: RAZORPAY_WEBHOOK_SECRET is not defined.');
    return NextResponse.json({ error: 'Config missing' }, { status: 500 });
  }

  const signature = req.headers.get('x-razorpay-signature');
  const body = await req.text();

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== signature) {
    console.warn('[WEBHOOK_SECURITY_ALERT]: Invalid signature.');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const payload = JSON.parse(body);
  const event = payload.event;

  if (event === 'payment.captured') {
    const payment = payload.payload.payment.entity;
    const razorpayOrderId = payment.order_id;
    const paymentId = payment.id;

    console.log(`[FULFILLMENT_START]: Order ${razorpayOrderId} | Payment ${paymentId}`);

    const db = getAdminDb();

    try {
      await db.runTransaction(async (transaction) => {
        // 1. Locate the Pending Order
        const ordersQuery = db.collection('orders').where('paymentId', '==', razorpayOrderId).limit(1);
        const orderSnap = await transaction.get(ordersQuery);

        if (orderSnap.empty) {
          throw new Error(`Order ${razorpayOrderId} not found.`);
        }

        const orderDoc = orderSnap.docs[0];
        const orderData = orderDoc.data();

        // 2. Strict Idempotency Check
        if (orderData.status === 'paid') {
          console.log('[FULFILLMENT_SKIP]: Already fulfilled.');
          return;
        }

        // 3. Prepare Aggregates & References
        const userRef = db.collection('users').doc(orderData.userId);
        const analyticsRef = db.collection('analytics').doc('global');
        const revenueRef = db.collection('revenue').doc(new Date().toISOString().slice(0, 7)); // Monthly rev

        // 4. Fulfillment Loop for each product
        for (const item of orderData.items) {
          const productRef = db.collection('products').doc(item.productId);
          const productSnap = await transaction.get(productRef);
          
          if (productSnap.exists) {
            const product = productSnap.data()!;
            
            // Generate Secure Download Record (License)
            const downloadRef = db.collection('downloads')
              .doc(orderData.userId)
              .collection('products')
              .doc(item.productId);

            transaction.set(downloadRef, {
              userId: orderData.userId,
              productId: item.productId,
              orderId: orderDoc.id,
              productName: product.name,
              productSlug: product.slug,
              productImage: product.images?.[0] || "",
              fileKey: product.fileKey,
              fileName: product.fileName || `${product.slug}.zip`,
              fileSize: product.fileSize || 0,
              fileFormat: product.fileFormat || "zip",
              fileVersion: product.fileVersion || "1.0",
              downloadLimit: 5,
              downloadCount: 0,
              purchasedAt: Timestamp.now(),
              isActive: true,
            }, { merge: true });

            // Increment Product Sales
            transaction.update(productRef, {
              salesCount: FieldValue.increment(1),
              updatedAt: FieldValue.serverTimestamp()
            });
          }
        }

        // 5. Update User Profile Aggregates
        if (orderData.userId !== 'guest') {
          transaction.update(userRef, {
            totalSpent: FieldValue.increment(orderData.total),
            orderCount: FieldValue.increment(1),
            lastPurchaseAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
          });
        }

        // 6. Update Global Analytics
        transaction.set(analyticsRef, {
          totalRevenue: FieldValue.increment(orderData.total),
          totalOrders: FieldValue.increment(1),
          lastUpdatedAt: FieldValue.serverTimestamp()
        }, { merge: true });

        transaction.set(revenueRef, {
          revenue: FieldValue.increment(orderData.total),
          orderCount: FieldValue.increment(1),
          month: new Date().toISOString().slice(0, 7)
        }, { merge: true });

        // 7. Finalize Order Status
        transaction.update(orderDoc.ref, {
          status: 'paid',
          paymentCapturedId: paymentId,
          paidAt: FieldValue.serverTimestamp(),
          verifiedVia: 'webhook_transactional'
        });

        // Background: Dispatch Email (Outside transaction context but within webhook logic)
        sendOrderConfirmationEmail({ 
          ...orderData, 
          id: orderDoc.id,
          paidAt: new Date().toISOString()
        }).catch(err => console.error('[WEBHOOK_EMAIL_ERROR]:', err.message));
      });

      console.log(`[FULFILLMENT_SUCCESS]: Completed atomic transaction for ${razorpayOrderId}`);
      return NextResponse.json({ success: true, processed: true });

    } catch (error: any) {
      console.error('[FULFILLMENT_CRITICAL_FAILURE]:', error.message);
      return NextResponse.json({ error: 'Atomic fulfillment failed', details: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
