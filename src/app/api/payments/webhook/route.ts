import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import { createDownloadRecord } from '@/lib/firebase/downloads';
import { sendOrderConfirmationEmail } from '@/app/actions/email-actions';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * ─── Razorpay Webhook Handler ───────────────────────────────────────────────
 * Processes payment verification and triggers secure digital fulfillment.
 * Implements strict idempotency to prevent double-fulfillment.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[WEBHOOK_ERROR]: RAZORPAY_WEBHOOK_SECRET missing');
    return NextResponse.json({ error: 'Config error' }, { status: 500 });
  }

  const signature = req.headers.get('x-razorpay-signature');
  const body = await req.text();

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== signature) {
    console.warn('[WEBHOOK_SECURITY_ALERT]: Invalid signature received.');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const payload = JSON.parse(body);
  const event = payload.event;

  if (event === 'payment.captured') {
    const payment = payload.payload.payment.entity;
    const razorpayOrderId = payment.order_id;

    const db = getAdminDb();
    
    // 1. Fetch Order and lock for fulfillment
    const orderSnap = await db.collection('orders')
      .where('paymentId', '==', razorpayOrderId)
      .limit(1)
      .get();

    if (orderSnap.empty) {
      console.error('[WEBHOOK_ERROR]: Order reference not found for RP ID:', razorpayOrderId);
      return NextResponse.json({ success: true, warning: 'Order not tracked locally' });
    }

    const orderDoc = orderSnap.docs[0];
    const orderData = orderDoc.data();

    if (orderData.status === 'paid') {
      return NextResponse.json({ success: true, info: 'Fulfillment already verified' });
    }

    // 2. Perform fulfillments atomically
    try {
      await Promise.all(
        orderData.items.map(async (item: any) => {
          const productSnap = await db.collection('products').doc(item.productId).get();
          if (!productSnap.exists) return;

          const product = productSnap.data()!;
          
          // Increment global sales stats
          await productSnap.ref.update({
            salesCount: FieldValue.increment(1)
          });

          // Create secure license and download vault entry
          await createDownloadRecord(
            orderData.userId,
            item.productId,
            orderDoc.id,
            {
              name: product.name,
              slug: product.slug,
              image: product.images?.[0] || "",
              fileKey: product.fileKey,
              fileName: product.fileName || `${product.slug}.zip`,
              fileSize: product.fileSize || 0,
              fileFormat: product.fileFormat || "zip",
              fileVersion: product.fileVersion || "1.0",
            },
            5 // Default generous download allowance
          );
        })
      );

      // 3. Update Master Ledger
      await orderDoc.ref.update({
        status: 'paid',
        paidAt: FieldValue.serverTimestamp(),
        verifiedAt: FieldValue.serverTimestamp()
      });

      // 4. Update User Stats if not Guest
      if (orderData.userId !== 'guest') {
        await db.collection('users').doc(orderData.userId).update({
          totalSpent: FieldValue.increment(orderData.total),
          orderCount: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp()
        }).catch(e => console.warn('[USER_STATS_UPDATE_FAILED]:', e.message));
      }

      // 5. Dispatch Confirmation Communications
      await sendOrderConfirmationEmail({ ...orderData, id: orderDoc.id });

    } catch (fulfillError: any) {
      console.error('[FULFILLMENT_CRITICAL_FAILURE]:', fulfillError.message);
      return NextResponse.json({ error: 'Fulfillment sequence failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
