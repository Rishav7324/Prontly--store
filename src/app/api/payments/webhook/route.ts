import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import { createDownloadRecord } from '@/lib/firebase/downloads';
import { sendOrderConfirmationEmail } from '@/app/actions/email-actions';

/**
 * ─── Razorpay Webhook Handler ───────────────────────────────────────────────
 * Processes payment verification and triggers digital fulfillment.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Config error' }, { status: 500 });

  const signature = req.headers.get('x-razorpay-signature');
  const body = await req.text();

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const payload = JSON.parse(body);
  const event = payload.event;

  if (event === 'payment.captured') {
    const payment = payload.payload.payment.entity;
    const razorpayOrderId = payment.order_id;

    const db = getAdminDb();
    
    // Find order in Firestore
    const orderSnap = await db.collection('orders')
      .where('paymentId', '==', razorpayOrderId)
      .limit(1)
      .get();

    if (orderSnap.empty) return NextResponse.json({ success: true, warning: 'Order not found locally' });

    const orderDoc = orderSnap.docs[0];
    const orderData = orderDoc.data();

    if (orderData.status === 'paid') return NextResponse.json({ success: true, info: 'Already processed' });

    // ── Fulfillment Loop ──────────────────────────────────────────────────────
    await Promise.all(
      orderData.items.map(async (item: any) => {
        const productSnap = await db.collection('products').doc(item.productId).get();
        if (!productSnap.exists) return;

        const product = productSnap.data()!;
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
          5 // Default download limit
        );
      })
    );

    // Update Order Status
    await orderDoc.ref.update({
      status: 'paid',
      paidAt: new Date().toISOString()
    });

    // Send Email
    await sendOrderConfirmationEmail({ ...orderData, id: orderDoc.id });
  }

  return NextResponse.json({ success: true });
}