import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { verifyPaymentSignature } from '@/lib/razorpay/client';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { generateInvoicePdf } from '@/lib/payment/invoice';
import { sendOrderConfirmationEmail } from '@/app/actions/email-actions';

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

    const db = getAdminDb();

    // 2. Atomic Fulfillment Transaction
    const result = await db.runTransaction(async (transaction) => {
      const orderRef = db.collection('orders').doc(razorpay_order_id);
      
      // --- READS ---
      const orderSnap = await transaction.get(orderRef);
      if (!orderSnap.exists) throw new Error('Order intent not found');
      const order = orderSnap.data()!;

      // Idempotency check
      if (order.status === 'paid') return { status: 'already_paid' };

      // Fetch all products first (READS) before any writes
      const productsData: Record<string, any> = {};
      for (const item of order.items) {
        const productRef = db.collection('products').doc(item.productId);
        const productSnap = await transaction.get(productRef);
        if (productSnap.exists) {
          productsData[item.productId] = productSnap.data();
        }
      }

      // --- WRITES ---
      
      // A. Update Order Status
      transaction.update(orderRef, {
        status: 'paid',
        paidAt: Timestamp.now(),
        razorpayPaymentId: razorpay_payment_id
      });

      // B. Provision Digital Assets (Downloads)
      for (const item of order.items) {
        const product = productsData[item.productId];
        if (product) {
          const downloadRef = db.collection('downloads')
            .doc(order.userId)
            .collection('products')
            .doc(item.productId);

          transaction.set(downloadRef, {
            userId: order.userId,
            productId: item.productId,
            orderId: razorpay_order_id,
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

          // Update product metrics
          transaction.update(db.collection('products').doc(item.productId), {
            salesCount: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp()
          });
        }
      }

      // C. Update User Aggregates (Merge-safe)
      const userRef = db.collection('users').doc(order.userId);
      transaction.set(userRef, {
        totalSpent: FieldValue.increment(order.totalAmount || order.total || 0),
        orderCount: FieldValue.increment(1),
        lastPurchaseAt: Timestamp.now(),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      // D. Update Global Analytics
      const analyticsRef = db.collection('analytics').doc('global');
      transaction.set(analyticsRef, {
        totalRevenue: FieldValue.increment(order.totalAmount || order.total || 0),
        totalOrders: FieldValue.increment(1),
        lastUpdatedAt: FieldValue.serverTimestamp()
      }, { merge: true });

      return { status: 'fulfilled', orderData: { ...order, id: razorpay_order_id } };
    });

    if (result.status === 'fulfilled') {
      // Background: Generate Receipt PDF and update order
      try {
        const pdfBase64 = await generateInvoicePdf(result.orderData);
        await db.collection('orders').doc(razorpay_order_id).update({
          invoicePdfBase64: pdfBase64
        });
        
        // Dispatch Confirmation Email
        await sendOrderConfirmationEmail(result.orderData);
      } catch (err) {
        console.error('[FULFILLMENT_POST_PROCESSING_ERROR]:', err);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[VERIFY_PAYMENT_FAILURE]:', error.message);
    return NextResponse.json({ error: 'Fulfillment failed' }, { status: 500 });
  }
}
