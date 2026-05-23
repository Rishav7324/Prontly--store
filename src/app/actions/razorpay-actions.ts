'use server';

import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

/**
 * Creates a Razorpay Order on the server.
 * @param amount Total amount in paise (e.g. 10000 for ₹100)
 */
export async function createRazorpayOrder(amount: number) {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials are not configured on the server.');
    }

    const options = {
      amount: Math.round(amount),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    
    // Return only serializable data
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
    return { success: false, error: error.message || 'Failed to create payment order.' };
  }
}

/**
 * Verifies the Razorpay payment signature for security.
 */
export async function verifyRazorpayPayment(orderId: string, paymentId: string, signature: string) {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const hmac = crypto.createHmac('sha256', secret);
    
    hmac.update(orderId + "|" + paymentId);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature === signature) {
      return { success: true };
    } else {
      return { success: false, error: 'Cryptographic signature verification failed.' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
