import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import { sendOrderConfirmationEmail } from '@/app/actions/email-actions';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

/**
 * ─── PRODUCTION FULFILLMENT ENGINE ──────────────────────────────────────────
 * Path: /api/razorpay/webhook
 * Handles: payment.captured
 * 
 * Implements a global Firestore Transaction to ensure data integrity across:
 * Orders, Users, Downloads, Analytics, and Revenue.
 */
export async function POST(req: NextRequest) {
  console.log('[RAZORPAY_WEBHOOK]: Initializing secure verification...');
  
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[WEBHOOK_CONFIG_ERROR]: RAZORPAY_WEBHOOK_SECRET is not defined.');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const signature = req.headers.get('x-razorpay-signature');
  const body = await req.text();

  // 1. Secure Signature Verification
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== signature) {
    console.warn('[WEBHOOK_SECURITY_ALERT]: Invalid signature. Request rejected.');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const payload = JSON.parse(body);
  const event = payload.event;

  console.log(`[WEBHOOK_EVENT]: Received ${event}`);

  if (event === 'payment.captured') {
    const payment = payload.payload.payment.entity;
    const razorpayOrderId = payment.order_id;
    const paymentId = payment.id;

    console.log(`[FULFILLMENT_START]: RazorpayOrder: ${razorpayOrderId} | Payment: ${paymentId}`);

    const db = getAdminDb();

    try {
      await db.runTransaction(async (transaction) => {
        // A. Locate the Pending Order
        const ordersQuery = db.collection('orders').where('paymentId', '==', razorpayOrderId).limit(1);
        const orderSnap = await transaction.get(ordersQuery);

        if (orderSnap.empty) {
          throw new Error(`Order intent for ${razorpayOrderId} not found.`);
        }

        const orderDoc = orderSnap.docs[0];
        const orderData = orderDoc.data();

        // B. Strict Idempotency Check
        if (orderData.status === 'paid') {
          console.log('[FULFILLMENT_SKIP]: Order already processed.');
          return;
        }

        // C. Prepare References
        const userRef = db.collection('users').doc(orderData.userId);
        const analyticsRef = db.collection('analytics').doc('global');
        const revenueRef = db.collection('revenue').doc(new Date().toISOString().slice(0, 7));

        // D. Provision Digital Asset Licenses
        for (const item of orderData.items) {
          const productRef = db.collection('products').doc(item.productId);
          const productSnap = await transaction.get(productRef);
          
          if (productSnap.exists) {
            const product = productSnap.data()!;
            
            // Create Secure License Entitlement
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

            // Update Product Stats
            transaction.update(productRef, {
              salesCount: FieldValue.increment(1),
              updatedAt: FieldValue.serverTimestamp()
            });
          }
        }

        // E. Update User Profile Aggregates (MERGE-SAFE)
        transaction.set(userRef, {
          totalSpent: FieldValue.increment(orderData.total),
          orderCount: FieldValue.increment(1),
          lastPurchaseAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });

        // F. Global Analytics Ledger
        transaction.set(analyticsRef, {
          totalRevenue: FieldValue.increment(orderData.total),
          totalOrders: FieldValue.increment(1),
          lastUpdatedAt: FieldValue.serverTimestamp()
        }, { merge: true });

        // G. Monthly Revenue Aggregation
        transaction.set(revenueRef, {
          revenue: FieldValue.increment(orderData.total),
          orderCount: FieldValue.increment(1),
          month: new Date().toISOString().slice(0, 7)
        }, { merge: true });

        // H. Finalize Order Status
        transaction.update(orderDoc.ref, {
          status: 'paid',
          paymentCapturedId: paymentId,
          paidAt: FieldValue.serverTimestamp(),
          verifiedVia: 'razorpay_webhook_v2'
        });
      });

      console.log(`[FULFILLMENT_SUCCESS]: Atomic sync completed for ${paymentId}`);

      // Dispatch Confirmation Email in background
      const finalOrderSnap = await db.collection('orders').where('paymentId', '==', razorpayOrderId).limit(1).get();
      if (!finalOrderSnap.empty) {
        const doc = finalOrderSnap.docs[0];
        sendOrderConfirmationEmail({ ...doc.data(), id: doc.id })
          .catch(err => console.error('[WEBHOOK_EMAIL_ERROR]:', err.message));
      }

      return NextResponse.json({ success: true, message: 'Fulfillment completed' });

    } catch (error: any) {
      console.error('[FULFILLMENT_CRITICAL_FAILURE]:', error.message);
      return NextResponse.json({ error: 'Transaction failed', details: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, message: 'Event ignored' });
}

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
