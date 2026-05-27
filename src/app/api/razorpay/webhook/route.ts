import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyWebhookSignature } from '@/lib/razorpay/client';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { generateInvoicePdf } from '@/lib/payment/invoice';
import { sendOrderConfirmationEmail } from '@/app/actions/email-actions';

/**
 * ─── PRODUCTION RAZORPAY WEBHOOK TERMINAL ───────────────────────────────────
 * Fallback fulfillment for missed client-side verifications.
 * Uses raw text body for cryptographic integrity.
 * GST features removed from data sync.
 */
export async function POST(req: NextRequest) {
  console.log('[RAZORPAY_WEBHOOK]: Signal received.');

  const signature = req.headers.get('x-razorpay-signature');
  if (!signature) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rawBody = await req.text();
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error('[WEBHOOK_SECURITY_ALERT]: Signature mismatch rejected.');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const eventType = event.event;
  console.log(`[WEBHOOK_EVENT]: Verified ${eventType}`);

  // Fulfillment triggers primarily on 'order.paid'
  if (eventType !== 'order.paid' && eventType !== 'payment.captured') {
    return NextResponse.json({ received: true });
  }

  const razorpayEntity = event.payload.order ? event.payload.order.entity : event.payload.payment.entity;
  const razorpayOrderId = event.payload.order ? razorpayEntity.id : razorpayEntity.order_id;
  const razorpayPaymentId = event.payload.payment.entity.id;

  if (!razorpayOrderId) return NextResponse.json({ received: true });

  const db = getAdminDb();

  try {
    const result = await db.runTransaction(async (transaction) => {
      const orderRef = db.collection('orders').doc(razorpayOrderId);
      
      // --- READS ---
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists) return { status: 'skipped', reason: 'order_not_found' };
      const order = orderSnap.data()!;

      if (order.status === 'paid') return { status: 'already_paid' };

      // Fetch product data first
      const productsData: Record<string, any> = {};
      for (const item of (order.items || [])) {
        const productRef = db.collection('products').doc(item.productId);
        const productSnap = await transaction.get(productRef);
        if (productSnap.exists) {
          productsData[item.productId] = productSnap.data();
        }
      }

      // --- WRITES ---
      transaction.update(orderRef, {
        status: 'paid',
        paidAt: Timestamp.now(),
        razorpayPaymentId: razorpayPaymentId
      });

      for (const item of (order.items || [])) {
        const product = productsData[item.productId];
        if (product) {
          const downloadRef = db.collection('downloads')
            .doc(order.userId)
            .collection('products')
            .doc(item.productId);

          transaction.set(downloadRef, {
            userId: order.userId,
            productId: item.productId,
            orderId: razorpayOrderId,
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
            downloadAllowed: true
          }, { merge: true });

          transaction.update(db.collection('products').doc(item.productId), { salesCount: FieldValue.increment(1) });
        }
      }

      const userRef = db.collection('users').doc(order.userId);
      transaction.set(userRef, {
        totalSpent: FieldValue.increment(order.totalAmount || order.total || 0),
        orderCount: FieldValue.increment(1),
        lastPurchaseAt: Timestamp.now()
      }, { merge: true });

      const analyticsRef = db.collection('analytics').doc('global');
      transaction.set(analyticsRef, {
        totalRevenue: FieldValue.increment(order.totalAmount || order.total || 0),
        totalOrders: FieldValue.increment(1)
      }, { merge: true });

      return { status: 'fulfilled', orderData: { ...order, id: razorpayOrderId } };
    });

    if (result.status === 'fulfilled') {
      try {
        const pdfBase64 = await generateInvoicePdf(result.orderData);
        await db.collection('orders').doc(razorpayOrderId).update({
          invoicePdfBase64: pdfBase64
        });
        
        // Dispatch Confirmation Email
        await sendOrderConfirmationEmail(result.orderData);
      } catch (err) {
        console.error('[WEBHOOK_POST_PROCESSING_ERROR]:', err);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[WEBHOOK_CRITICAL_FAILURE]:', error.message);
    return NextResponse.json({ error: 'Fulfillment error' }, { status: 500 });
  }
}
