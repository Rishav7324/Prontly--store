import { NextResponse } from 'next/server';

/**
 * @deprecated This route has been moved to /api/razorpay/webhook for standardization.
 */
export async function POST() {
  return NextResponse.json({ error: 'Route moved to /api/razorpay/webhook' }, { status: 410 });
}
