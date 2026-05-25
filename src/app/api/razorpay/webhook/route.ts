import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import { sendOrderConfirmationEmail } from '@/app/actions/email-actions';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

/**
 * ─── PRODUCTION WEBHOOK TERMINAL ────────────────────────────────────────────
 * Path: /api/razorpay/webhook
 * 
 * This route is the single source of truth for payment fulfillment.
 * It implements raw-body HMAC verification and atomic Firestore transactions.
 */

export async function POST(req: NextRequest) {
  console.log('[RAZORPAY_WEBHOOK]: Signal received.');

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[WEBHOOK_CONFIG_ERROR]: RAZORPAY_WEBHOOK_SECRET is not defined in environment.');
    return NextResponse.json({ error: 'Server configuration mismatch' }, { status: 500 });
  }

  const signature = req.headers.get('x-razorpay-signature');
  if (!signature) {
    console.error('[WEBHOOK_AUTH_ERROR]: Missing x-razorpay-signature header.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 400 });
  }

  // 1. RAW BODY PARSING (CRITICAL: Do NOT use req.json() before HMAC verification)
  const body = await req.text();

  // 2. HMAC-SHA256 SIGNATURE VERIFICATION
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== signature) {
    console.warn('[WEBHOOK_SECURITY_ALERT]: Signature mismatch. Unauthorized payload rejected.');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const payload = JSON.parse(body);
  const event = payload.event;
  console.log(`[WEBHOOK_EVENT]: Verified ${event}`);

  // 3. EVENT ROUTING
  // We process main fulfillment on order.paid or payment.captured as fallback
  if (event === 'order.paid' || event === 'payment.captured') {
    const isOrderEvent = event === 'order.paid';
    const razorpayOrderId = isOrderEvent ? payload.payload.order.entity.id : payload.payload.payment.entity.order_id;
    const paymentId = isOrderEvent ? payload.payload.order.entity.id : payload.payload.payment.entity.id;

    console.log(`[FULFILLMENT_INIT]: RazorpayID: ${razorpayOrderId}`);

    const db = getAdminDb();

    try {
      await db.runTransaction(async (transaction) => {
        // A. Locate Order Intent
        const ordersQuery = db.collection('orders').where('paymentId', '==', razorpayOrderId).limit(1);
        const orderSnap = await transaction.get(ordersQuery);

        if (orderSnap.empty) {
          console.warn(`[FULFILLMENT_SKIP]: No pending intent found for ${razorpayOrderId}.`);
          return;
        }

        const orderDoc = orderSnap.docs[0];
        const orderData = orderDoc.data();

        // B. Idempotency Check
        if (orderData.status === 'paid') {
          console.log('[FULFILLMENT_SKIP]: Transaction already processed.');
          return;
        }

        // C. Prepare References
        const userRef = db.collection('users').doc(orderData.userId);
        const analyticsRef = db.collection('analytics').doc('global');
        const revenueRef = db.collection('revenue').doc(new Date().toISOString().slice(0, 7));

        // D. Provision Digital Licenses
        for (const item of (orderData.items || [])) {
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

        // G. Monthly Revenue Stats
        transaction.set(revenueRef, {
          revenue: FieldValue.increment(orderData.total),
          orderCount: FieldValue.increment(1),
          month: new Date().toISOString().slice(0, 7)
        }, { merge: true });

        // H. Finalize Order Record
        transaction.update(orderDoc.ref, {
          status: 'paid',
          paymentCapturedId: paymentId,
          paidAt: FieldValue.serverTimestamp(),
          verifiedVia: 'razorpay_webhook_production'
        });
      });

      console.log(`[FULFILLMENT_SUCCESS]: Atomic sync completed for ${razorpayOrderId}`);

      // I. Dispatch Confirmation Email (Background)
      const finalOrderSnap = await db.collection('orders').where('paymentId', '==', razorpayOrderId).limit(1).get();
      if (!finalOrderSnap.empty) {
        const doc = finalOrderSnap.docs[0];
        sendOrderConfirmationEmail({ ...doc.data(), id: doc.id })
          .catch(err => console.warn('[WEBHOOK_EMAIL_ERROR]:', err.message));
      }

      return NextResponse.json({ success: true });

    } catch (error: any) {
      console.error('[FULFILLMENT_CRITICAL_FAILURE]:', error.message);
      return NextResponse.json({ error: 'Transaction failed', details: error.message }, { status: 500 });
    }
  }

  // Handle other event types with 200 OK to satisfy Razorpay
  return NextResponse.json({ success: true, message: 'Event ignored' });
}

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
