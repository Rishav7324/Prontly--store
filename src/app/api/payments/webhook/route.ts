import { NextResponse } from 'next/server';

/**
 * @deprecated This route has been moved to /api/razorpay/webhook for standardization.
 * Please update your Razorpay Dashboard webhook URL.
 */
export async function POST() {
  return NextResponse.json({ error: 'Route moved to /api/razorpay/webhook' }, { status: 410 });
}
