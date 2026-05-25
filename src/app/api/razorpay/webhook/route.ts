import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import { sendOrderConfirmationEmail } from '@/app/actions/email-actions';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

/**
 * ─── PRODUCTION RAZORPAY WEBHOOK TERMINAL ───────────────────────────────────
 * Path: /api/razorpay/webhook
 * 
 * This route is the definitive source of truth for payment fulfillment.
 * Implements strict raw-body HMAC verification and atomic transactions.
 */

export async function POST(req: NextRequest) {
  console.log('[RAZORPAY_WEBHOOK]: Signal received at terminal.');

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers.get('x-razorpay-signature');

  if (!secret) {
    console.error('[WEBHOOK_CONFIG_ERROR]: RAZORPAY_WEBHOOK_SECRET is missing.');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  if (!signature) {
    console.error('[WEBHOOK_AUTH_ERROR]: Missing x-razorpay-signature header.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 400 });
  }

  // 1. RAW BODY PARSING (CRITICAL: req.text() is required for HMAC accuracy)
  const body = await req.text();

  // 2. HMAC-SHA256 SIGNATURE VERIFICATION
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== signature) {
    console.warn('[WEBHOOK_SECURITY_ALERT]: Signature mismatch. Payload rejected.');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // 3. PARSE EVENT DATA
  let event;
  try {
    event = JSON.parse(body);
  } catch (e) {
    console.error('[WEBHOOK_PARSE_ERROR]: Failed to parse body as JSON.');
    return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 });
  }

  const eventType = event.event;
  console.log(`[WEBHOOK_EVENT]: Verified ${eventType}`);

  // 4. EVENT ROUTING
  // Main fulfillment happens on 'order.paid' for Standard Checkout
  if (eventType !== 'order.paid') {
    return NextResponse.json({ success: true, message: 'Event logged and acknowledged' });
  }

  const razorpayOrder = event.payload.order.entity;
  const razorpayOrderId = razorpayOrder.id;

  console.log(`[FULFILLMENT_INIT]: OrderID: ${razorpayOrderId}`);

  const db = getAdminDb();

  try {
    const result = await db.runTransaction(async (transaction) => {
      // A. Locate Order Intent in Firestore
      const ordersQuery = db.collection('orders').where('paymentId', '==', razorpayOrderId).limit(1);
      const orderSnap = await transaction.get(ordersQuery);

      if (orderSnap.empty) {
        console.warn(`[FULFILLMENT_SKIP]: No pending intent found for ${razorpayOrderId}.`);
        return { status: 'intent_not_found' };
      }

      const orderDoc = orderSnap.docs[0];
      const orderData = orderDoc.data();

      // B. Idempotency Check (Duplicate Protection)
      if (orderData.status === 'paid') {
        console.log('[FULFILLMENT_SKIP]: Transaction already processed.');
        return { status: 'already_fulfilled' };
      }

      // C. Prepare Ledger References
      const userRef = db.collection('users').doc(orderData.userId);
      const analyticsRef = db.collection('analytics').doc('global');
      const revenueMonth = new Date().toISOString().slice(0, 7);
      const revenueRef = db.collection('revenue').doc(revenueMonth);

      // D. PROVISION DIGITAL ASSETS (Atomic Entitlements)
      for (const item of (orderData.items || [])) {
        const productRef = db.collection('products').doc(item.productId);
        const productSnap = await transaction.get(productRef);
        
        if (productSnap.exists) {
          const product = productSnap.data()!;
          
          // Create Secure Download License
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

          // Increment Product Sales Metrics
          transaction.update(productRef, {
            salesCount: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp()
          });
        }
      }

      // E. Update User Aggregates (Merge-Safe)
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

      // G. Monthly Revenue Distribution
      transaction.set(revenueRef, {
        revenue: FieldValue.increment(orderData.total),
        orderCount: FieldValue.increment(1),
        month: revenueMonth
      }, { merge: true });

      // H. Finalize Order Record
      transaction.update(orderDoc.ref, {
        status: 'paid',
        paidAt: FieldValue.serverTimestamp(),
        razorpayEventId: event.id,
        verificationMethod: 'hmac_sha256_webhook'
      });

      return { status: 'fulfilled', orderId: orderDoc.id };
    });

    console.log(`[FULFILLMENT_SUCCESS]: Atomic sync completed for ${razorpayOrderId} | Status: ${result.status}`);

    // I. Dispatch Confirmation Email in background
    if (result.status === 'fulfilled') {
      const finalOrderSnap = await db.collection('orders').where('paymentId', '==', razorpayOrderId).limit(1).get();
      if (!finalOrderSnap.empty) {
        const doc = finalOrderSnap.docs[0];
        sendOrderConfirmationEmail({ ...doc.data(), id: doc.id })
          .catch(err => console.warn('[WEBHOOK_EMAIL_ERROR]:', err.message));
      }
    }

    return NextResponse.json({ success: true, status: result.status });

  } catch (error: any) {
    console.error('[FULFILLMENT_CRITICAL_FAILURE]:', error.message);
    return NextResponse.json({ error: 'Internal synchronization failure', details: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
