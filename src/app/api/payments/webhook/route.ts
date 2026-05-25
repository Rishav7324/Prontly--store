import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import { createDownloadRecord } from '@/lib/firebase/downloads';
import { sendOrderConfirmationEmail } from '@/app/actions/email-actions';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * ─── Razorpay Webhook Handler ───────────────────────────────────────────────
 * The primary engine for payment verification and digital fulfillment.
 * Implements strict idempotency and server-side processing for high reliability.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[WEBHOOK_CONFIG_ERROR]: RAZORPAY_WEBHOOK_SECRET is not defined.');
    return NextResponse.json({ error: 'Config missing' }, { status: 500 });
  }

  const signature = req.headers.get('x-razorpay-signature');
  const body = await req.text();

  // Validate the authenticity of the webhook call
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== signature) {
    console.warn('[WEBHOOK_SECURITY_ALERT]: Received an invalid signature from Razorpay endpoint.');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const payload = JSON.parse(body);
  const event = payload.event;

  // Primary event we care about for digital fulfillment
  if (event === 'payment.captured') {
    const payment = payload.payload.payment.entity;
    const razorpayOrderId = payment.order_id;
    const paymentId = payment.id;

    console.log(`[WEBHOOK_FULTILLMENT_START]: RP Order ${razorpayOrderId} | Payment ${paymentId}`);

    const db = getAdminDb();
    
    // 1. Locate the "Pending" Intent order created by the client
    const orderSnap = await db.collection('orders')
      .where('paymentId', '==', razorpayOrderId)
      .limit(1)
      .get();

    if (orderSnap.empty) {
      console.error('[WEBHOOK_ERROR]: No local order reference matches Razorpay Order ID:', razorpayOrderId);
      return NextResponse.json({ success: true, warning: 'Order not found in database' });
    }

    const orderDoc = orderSnap.docs[0];
    const orderData = orderDoc.data();

    // 2. Strict Idempotency: Don't fulfill twice
    if (orderData.status === 'paid') {
      console.log('[WEBHOOK_INFO]: Order already fulfilled. Skipping duplicate sequence.');
      return NextResponse.json({ success: true, info: 'Fulfillment completed' });
    }

    // 3. Core Fulfillment Sequence
    try {
      console.log(`[WEBHOOK_FULFILLING_ASSETS]: Processing ${orderData.items?.length || 0} items...`);
      
      await Promise.all(
        orderData.items.map(async (item: any) => {
          const productSnap = await db.collection('products').doc(item.productId).get();
          if (!productSnap.exists) {
            console.error(`[WEBHOOK_ITEM_ERROR]: Product ${item.productId} missing from catalog.`);
            return;
          }

          const product = productSnap.data()!;
          
          // Increment global analytics for the product
          await productSnap.ref.update({
            salesCount: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp()
          });

          // Create a secure license record in the user's personal vault
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
            5 // Default generous download allowance (5 attempts)
          );
        })
      );

      // 4. Update the Order Status globally
      await orderDoc.ref.update({
        status: 'paid',
        paymentCapturedId: paymentId, // Log the specific capture ID
        paidAt: FieldValue.serverTimestamp(),
        fulfilledAt: FieldValue.serverTimestamp(),
        verifiedVia: 'webhook'
      });

      // 5. Aggregate user-specific lifetime stats
      if (orderData.userId !== 'guest') {
        const userRef = db.collection('users').doc(orderData.userId);
        await userRef.update({
          totalSpent: FieldValue.increment(orderData.total),
          orderCount: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
          lastPurchaseAt: FieldValue.serverTimestamp()
        }).catch(e => console.warn('[USER_STATS_UPGRADE_FAILED]:', e.message));
      }

      // 6. Dispatch final confirmation communications
      // We don't await this to be critical so failures in email don't roll back the webhook response
      sendOrderConfirmationEmail({ 
        ...orderData, 
        id: orderDoc.id,
        paidAt: new Date().toISOString()
      }).catch(err => console.error('[WEBHOOK_EMAIL_ERROR]:', err.message));

      console.log(`[WEBHOOK_SUCCESS]: Fulfillment sequence completed for ${orderDoc.id}`);

    } catch (fulfillError: any) {
      console.error('[WEBHOOK_CRITICAL_ERROR]: Fulfillment logic failure:', fulfillError.message);
      return NextResponse.json({ error: 'Fulfillment process failed internally' }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, processed: true });
}
