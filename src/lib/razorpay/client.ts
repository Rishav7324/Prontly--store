import Razorpay from 'razorpay';
import crypto from 'crypto';

/**
 * Initialized Razorpay client with secure environment variables.
 */
export const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

/**
 * Creates a new Razorpay Order.
 */
export async function createRazorpayOrder(params: {
  amount: number;
  receipt: string;
  notes: Record<string, any>;
}) {
  return razorpayInstance.orders.create({
    amount: Math.round(params.amount),
    currency: "INR",
    receipt: params.receipt,
    notes: params.notes,
  });
}

/**
 * Verifies the payment signature sent by the frontend handler.
 * This MUST use the KEY_SECRET.
 */
export function verifyPaymentSignature(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error("Key secret missing on server.");

  const body = params.razorpay_order_id + "|" + params.razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body.toString())
    .digest('hex');

  return expectedSignature === params.razorpay_signature;
}

/**
 * Verifies the signature sent by Razorpay Webhooks.
 * This MUST use the WEBHOOK_SECRET.
 */
export function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('RAZORPAY_WEBHOOK_SECRET missing on server.');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}
