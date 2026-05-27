import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import { sendOrderConfirmationEmail } from '@/app/actions/email-actions';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { calculatePriceBreakdown } from '@/lib/payment/gst';

/**
 * ─── PRODUCTION RAZORPAY WEBHOOK TERMINAL ───────────────────────────────────
 * Path: /api/razorpay/webhook
 * 
 * Atomic fulfillment engine for Prontly Store.
 * Implements 18% GST processing and secure digital licensing.
 */

export async function POST(req: NextRequest) {
  console.log('[RAZORPAY_WEBHOOK]: Signal received at terminal.');

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers.get('x-razorpay-signature');

  if (!secret || !signature) {
    console.error('[WEBHOOK_AUTH_ERROR]: Credentials or signature missing.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. RAW BODY PARSING (Crucial for HMAC verification)
  const body = await req.text();

  // 2. SIGNATURE VERIFICATION
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== signature) {
    console.warn('[WEBHOOK_SECURITY_ALERT]: Signature mismatch rejected.');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // 3. PARSE EVENT
  let event;
  try {
    event = JSON.parse(body);
  } catch (e) {
    return NextResponse.json({ error: 'Malformed payload' }, { status: 400 });
  }

  const eventType = event.event;
  console.log(`[WEBHOOK_EVENT]: Verified ${eventType}`);

  // Fulfillment triggers only on 'order.paid'
  if (eventType !== 'order.paid') {
    return NextResponse.json({ success: true, message: 'Event acknowledged' });
  }

  const razorpayOrder = event.payload.order.entity;
  const razorpayOrderId = razorpayOrder.id;

  const db = getAdminDb();

  try {
    const result = await db.runTransaction(async (transaction) => {
      // A. Locate Intent
      const ordersQuery = db.collection('orders').where('paymentId', '==', razorpayOrderId).limit(1);
      const orderSnap = await transaction.get(ordersQuery);

      if (orderSnap.empty) {
        console.warn(`[FULFILLMENT_SKIP]: Intent not found for ${razorpayOrderId}`);
        return { status: 'intent_not_found' };
      }

      const orderDoc = orderSnap.docs[0];
      const orderData = orderDoc.data();

      // B. Idempotency Check
      if (orderData.status === 'paid') return { status: 'already_fulfilled' };

      // C. Calculate Final Financials with GST
      const breakdown = calculatePriceBreakdown(orderData.subtotal, orderData.discount || 0);

      // D. Provision Digital Assets
      for (const item of (orderData.items || [])) {
        const productRef = db.collection('products').doc(item.productId);
        const productSnap = await transaction.get(productRef);
        
        if (productSnap.exists) {
          const product = productSnap.data()!;
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

          transaction.update(productRef, {
            salesCount: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp()
          });
        }
      }

      // E. Update User Profile (Merge-Safe)
      const userRef = db.collection('users').doc(orderData.userId);
      transaction.set(userRef, {
        totalSpent: FieldValue.increment(breakdown.total),
        orderCount: FieldValue.increment(1),
        lastPurchaseAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      // F. Update Global Analytics
      const analyticsRef = db.collection('analytics').doc('global');
      transaction.set(analyticsRef, {
        totalRevenue: FieldValue.increment(breakdown.total),
        totalOrders: FieldValue.increment(1),
        lastUpdatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      // G. Update Order Record
      transaction.update(orderDoc.ref, {
        status: 'paid',
        paidAt: FieldValue.serverTimestamp(),
        subtotal: breakdown.subtotal,
        gst: breakdown.gst,
        total: breakdown.total,
        razorpayPaymentId: event.payload.payment.entity.id,
        verificationMethod: 'hmac_sha256_webhook'
      });

      return { status: 'fulfilled', orderId: orderDoc.id };
    });

    if (result.status === 'fulfilled') {
      // Re-fetch full doc for email context
      const finalDoc = await db.collection('orders').doc(result.orderId!).get();
      await sendOrderConfirmationEmail({ ...finalDoc.data(), id: finalDoc.id })
        .catch(e => console.warn('[WEBHOOK_EMAIL_ERROR]:', e.message));
    }

    return NextResponse.json({ success: true, status: result.status });

  } catch (error: any) {
    console.error('[WEBHOOK_CRITICAL_FAILURE]:', error.message);
    return NextResponse.json({ error: 'Fulfillment error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
