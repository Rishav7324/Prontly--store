'use server';

import Razorpay from 'razorpay';
import crypto from 'crypto';

/**
 * Initialized Razorpay client with secure environment variables.
 * Initializing inside a getter to ensure env vars are loaded in the current execution context.
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
 * Creates a Razorpay Order on the server.
 * @param amount Total amount in paise (e.g. 10000 for ₹100)
 */
export async function createRazorpayOrder(amount: number) {
  try {
    const razorpay = getRazorpayClient();

    if (amount < 100) {
      throw new Error('Minimum amount must be ₹1 (100 paise).');
    }

    const options = {
      amount: Math.round(amount),
      currency: "INR",
      receipt: `order_rcpt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    
    return { 
      success: true, 
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      } 
    };
  } catch (error: any) {
    console.error('Razorpay Order Creation Error:', error);
    
    // Extract the most descriptive error message possible
    const errorMessage = 
      error.description || 
      (error.error && error.error.description) || 
      error.message || 
      'Failed to create payment order.';
      
    return { success: false, error: errorMessage };
  }
}

/**
 * Verifies the Razorpay payment signature for security using HMAC SHA256.
 */
export async function verifyRazorpayPayment(orderId: string, paymentId: string, signature: string) {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error("Key secret missing on server.");

    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(orderId + "|" + paymentId)
      .digest('hex');

    if (generatedSignature === signature) {
      return { success: true };
    } else {
      console.warn("Signature mismatch detected for order:", orderId);
      return { success: false, error: 'Cryptographic signature verification failed.' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
