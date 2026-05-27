'use server';

import Razorpay from 'razorpay';
import crypto from 'crypto';
import { calculatePriceBreakdown } from '@/lib/payment/gst';

/**
 * Initialized Razorpay client with secure environment variables.
 */
function getRazorpayClient() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay credentials are not configured on the server.');
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
}

/**
 * STEP 1: Create Razorpay Order
 * Now includes GST breakdown calculations.
 */
export async function createRazorpayOrder(amount: number) {
  try {
    const razorpay = getRazorpayClient();

    // Razorpay minimum amount is 100 paise (₹1)
    if (amount < 100) {
      throw new Error('Minimum transaction amount is ₹1 (100 paise).');
    }

    // Calculate GST Breakdown for the order
    const breakdown = calculatePriceBreakdown(amount);

    const options = {
      amount: Math.round(breakdown.total), // Final amount including GST
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        subtotal: breakdown.subtotal,
        gst: breakdown.gst,
        isGstIncluded: "true"
      }
    };

    const order = await razorpay.orders.create(options);
    
    return { 
      success: true, 
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      },
      breakdown
    };
  } catch (error: any) {
    console.error('Razorpay Order Error:', error);
    return { 
      success: false, 
      error: error.description || error.message || 'Authentication or API failure.' 
    };
  }
}

/**
 * STEP 3: Verify Payment Signature
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 */
export async function verifyRazorpayPayment(orderId: string, paymentId: string, signature: string) {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error("Key secret missing on server.");

    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === signature) {
      return { success: true };
    } else {
      console.warn("Security Warning: Signature mismatch for order:", orderId);
      return { success: false, error: 'Payment verification failed: Signature mismatch.' };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Internal verification error.' };
  }
}
