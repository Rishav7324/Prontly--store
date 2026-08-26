import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay/client';
import { generateInvoicePdf } from '@/lib/payment/invoice';
import { sendOrderConfirmationEmail, sendDeliveryEmail, sendNewOrderAlert } from '@/app/actions/email-actions';
import { getDb, getPgDb } from '@/lib/db';
import { orders, orderItems, products, downloads, users, analytics } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

  try {
    let result: any;

    if (isDatabaseConfigured()) {
      const { db: pgDb } = getPgDb();
      const dbPlain = getDb();
      result = await (pgDb as any).transaction(async (tx: any) => {
        const [order] = await tx.select().from(orders).where(eq(orders.id, razorpayOrderId)).limit(1);
        if (!order) return { status: 'skipped', reason: 'order_not_found' };
        if (order.status === 'paid') return { status: 'already_paid' };
        const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, razorpayOrderId));
        const productsData: Record<string, any> = {};
        for (const it of items) {
          const [prod] = await tx.select().from(products).where(eq(products.id, it.productId)).limit(1);
          if (prod) productsData[it.productId] = prod;
        }
        await tx.update(orders).set({ status: 'paid' as any, razorpayPaymentId, paidAt: new Date() as any }).where(eq(orders.id, razorpayOrderId));
        for (const it of items) {
          const prod = productsData[it.productId];
          if (prod) {
            await tx.insert(downloads).values({
              userId: order.userId,
              productId: it.productId as any,
              orderId: razorpayOrderId,
              productName: prod.name,
              productSlug: prod.slug,
              productImage: Array.isArray(prod.images) ? (prod.images as string[])[0] || '' : '',
              fileKey: prod.fileKey,
              fileName: prod.fileName || `${prod.slug}.zip`,
              fileSize: prod.fileSize || 0,
              fileFormat: prod.fileFormat || 'zip',
              fileVersion: prod.fileVersion || '1.0',
              downloadLimit: 5,
              downloadCount: 0,
              isActive: true,
              downloadAllowed: true,
            }).onConflictDoUpdate({ target: [downloads.userId, downloads.productId], set: { isActive: true } });
            await tx.update(products).set({ salesCount: (prod.salesCount ?? 0) + 1 } as any).where(eq(products.id, it.productId));
          }
        }
        const [u] = await tx.select().from(users).where(eq(users.uid, order.userId)).limit(1);
        if (u) await tx.update(users).set({ totalSpent: (u.totalSpent ?? 0) + (order.totalAmount || 0), orderCount: (u.orderCount ?? 0) + 1, lastPurchaseAt: new Date() as any }).where(eq(users.uid, order.userId));
        const [a] = await tx.select().from(analytics).where(eq(analytics.id, 'global')).limit(1);
        if (a) await tx.update(analytics).set({ totalRevenue: (a.totalRevenue ?? 0) + (order.totalAmount || 0), totalOrders: (a.totalOrders ?? 0) + 1 } as any).where(eq(analytics.id, 'global'));
        else await tx.insert(analytics).values({ id: 'global', totalRevenue: order.totalAmount || 0, totalOrders: 1 } as any).onConflictDoNothing();
        return { status: 'fulfilled', orderData: { ...order, id: razorpayOrderId, items } };
      });

      if (result.status === 'fulfilled') {
        try {
          const dbPlain = getDb();
          const pdfBase64 = await generateInvoicePdf(result.orderData);
          await dbPlain.update(orders).set({ invoicePdfBase64: pdfBase64 } as any).where(eq(orders.id, razorpayOrderId));
          await sendOrderConfirmationEmail(result.orderData);
          void sendDeliveryEmail(result.orderData).catch(() => {});
          void sendNewOrderAlert(result.orderData);
        } catch (err) {
          console.error('[WEBHOOK_POST_PROCESSING_ERROR]:', err);
        }
      }    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[WEBHOOK_CRITICAL_FAILURE]:', error.message);
    return NextResponse.json({ error: 'Fulfillment error' }, { status: 500 });
  }
}
