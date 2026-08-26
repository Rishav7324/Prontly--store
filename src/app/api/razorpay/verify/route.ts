import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSignature } from '@/lib/razorpay/client';
import { generateInvoicePdf } from '@/lib/payment/invoice';
import { sendOrderConfirmationEmail, sendDeliveryEmail, sendNewOrderAlert } from '@/app/actions/email-actions';
import { getDb, getPgDb } from '@/lib/db';
import { orders, orderItems, products, downloads, users, analytics } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * API: Client-side Verification handler
 * Triggers atomic fulfillment after Razorpay Checkout success.
 * GST logic removed.
 */
export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    // 1. Verify cryptographic signature using Key Secret
    const isValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!isValid) {
      console.warn('[VERIFY_FAIL]: Signature mismatch', { razorpay_order_id });
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // 2. Fulfillment — SQL path if DATABASE_URL set, else Firestore
    let result: any;
    let orderDataForPost: any = null;

    if (isDatabaseConfigured()) {
      // ── SQL (Neon) fulfillment with pg Pool transaction
      const { db: pgDb } = getPgDb();
      const dbPlain = getDb();
      result = await (pgDb as any).transaction(async (tx: any) => {
        const [order] = await tx.select().from(orders).where(eq(orders.id, razorpay_order_id)).limit(1);
        if (!order) throw new Error('Order intent not found');
        if (order.status === 'paid') return { status: 'already_paid' };

        const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, razorpay_order_id));
        const productsData: Record<string, any> = {};
        for (const it of items) {
          const [prod] = await tx.select().from(products).where(eq(products.id, it.productId)).limit(1);
          if (prod) productsData[it.productId] = prod;
        }

        await tx.update(orders).set({ status: 'paid' as any, razorpayPaymentId: razorpay_payment_id, paidAt: new Date() as any }).where(eq(orders.id, razorpay_order_id));

        for (const it of items) {
          const prod = productsData[it.productId];
          if (prod) {
            await tx
              .insert(downloads)
              .values({
                userId: order.userId,
                productId: it.productId as any,
                orderId: razorpay_order_id,
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
              })
              .onConflictDoUpdate({
                target: [downloads.userId, downloads.productId],
                set: { isActive: true, downloadAllowed: true },
              });
            await tx
              .update(products)
              .set({ salesCount: (prod.salesCount ?? 0) + 1 } as any)
              .where(eq(products.id, it.productId));
          }
        }

        const [u] = await tx.select().from(users).where(eq(users.uid, order.userId)).limit(1);
        if (u) {
          await tx
            .update(users)
            .set({
              totalSpent: (u.totalSpent ?? 0) + (order.totalAmount || 0),
              orderCount: (u.orderCount ?? 0) + 1,
              lastPurchaseAt: new Date() as any,
            })
            .where(eq(users.uid, order.userId));
        }

        const [a] = await tx.select().from(analytics).where(eq(analytics.id, 'global')).limit(1);
        if (a) {
          await tx.update(analytics).set({ totalRevenue: (a.totalRevenue ?? 0) + (order.totalAmount || 0), totalOrders: (a.totalOrders ?? 0) + 1 } as any).where(eq(analytics.id, 'global'));
        } else {
          await tx.insert(analytics).values({ id: 'global', totalRevenue: order.totalAmount || 0, totalOrders: 1 } as any).onConflictDoNothing();
        }

        return { status: 'fulfilled', orderData: { ...order, id: razorpay_order_id, items } };
      });

      if (result.status === 'fulfilled') {
        orderDataForPost = result.orderData;
        try {
          const pdfBase64 = await generateInvoicePdf(result.orderData);
          await dbPlain.update(orders).set({ invoicePdfBase64: pdfBase64 } as any).where(eq(orders.id, razorpay_order_id));
          await sendOrderConfirmationEmail(result.orderData);
          void sendDeliveryEmail(result.orderData).catch(() => {});
          void sendNewOrderAlert(result.orderData);
        } catch (err) {
          console.error('[FULFILLMENT_POST_PROCESSING_ERROR]:', err);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[VERIFY_PAYMENT_FAILURE]:', error.message);
    return NextResponse.json({ error: 'Fulfillment failed' }, { status: 500 });
  }
}
