import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { coupons } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * API: Validate Coupon (pre-checkout preview)
 * Validates isActive / expiry / maxUsageCount / minOrderAmount against the
 * provided subtotal. Read-only — NO usage increment here (create-order owns that).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawCode = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : '';
    const subtotal = Number(body?.subtotal);

    if (!rawCode || !Number.isFinite(subtotal) || subtotal <= 0) {
      return NextResponse.json(
        { success: false, valid: false, message: 'Invalid request.' },
        { status: 400 }
      );
    }

    let coupon: {
      type: string;
      value: number;
      minOrderAmount?: number | null;
      maxUsageCount?: number | null;
      usageCount?: number | null;
      expiresAt?: Date | string | null;
    } | null = null;

    // SQL only — Neon is the single source of truth
    {
      const db = getDb();
      const [row] = await db.select().from(coupons).where(eq(coupons.code, rawCode)).limit(1);
      if (row) {
        coupon = {
          type: row.type,
          value: row.value ?? 0,
          minOrderAmount: row.minOrderAmount,
          maxUsageCount: row.maxUsageCount,
          usageCount: row.usageCount,
          expiresAt: row.expiresAt,
        };
        if (!row.isActive) coupon = null;
      }
    }

    if (!coupon) {
      return NextResponse.json({
        success: true, valid: false, discountAmount: 0,
        message: 'This coupon is invalid or inactive.',
      });
    }

    const now = new Date();
    const expired = coupon.expiresAt ? new Date(coupon.expiresAt) < now : false;
    if (expired) {
      return NextResponse.json({
        success: true, valid: false, discountAmount: 0,
        message: 'This coupon has expired.',
      });
    }

    const maxed = coupon.maxUsageCount != null && (coupon.usageCount ?? 0) >= coupon.maxUsageCount;
    if (maxed) {
      return NextResponse.json({
        success: true, valid: false, discountAmount: 0,
        message: 'This coupon has reached its usage limit.',
      });
    }

    if (coupon.minOrderAmount != null && coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount) {
      return NextResponse.json({
        success: true, valid: false, discountAmount: 0,
        message: `Minimum order of ₹${(coupon.minOrderAmount / 100).toLocaleString('en-IN')} required for this coupon.`,
      });
    }

    // Matches server-side calculation in /api/razorpay/create-order
    const discountType = coupon.type === 'fixed' ? 'fixed' : 'percentage';
    const discountAmount = discountType === 'percentage'
      ? Math.round((subtotal * (coupon.value || 0)) / 100)
      : coupon.value || 0;

    return NextResponse.json({
      success: true,
      valid: true,
      code: rawCode,
      discountType,
      value: coupon.value,
      discountAmount,
      message: 'Coupon applied.',
    });
  } catch (error: any) {
    console.error('[COUPON_VALIDATE_ERROR]:', error.message);
    return NextResponse.json(
      { success: false, valid: false, message: 'Failed to validate coupon.' },
      { status: 500 }
    );
  }
}
