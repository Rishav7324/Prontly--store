/**
 * @fileOverview GST Calculation Engine for Prontly Store.
 * Implements standard 18% GST for digital goods.
 */

export const GST_RATE = 0.18;

export interface PriceBreakdown {
  subtotal: number;      // in paise
  discount: number;      // in paise
  taxableAmount: number; // subtotal - discount
  gst: number;           // 18% of taxableAmount
  total: number;         // taxableAmount + gst
}

/**
 * Calculates the full price breakdown including 18% GST.
 */
export function calculateGST(params: {
  subtotal: number;
  discountAmount: number;
}): PriceBreakdown {
  const taxableAmount = Math.max(0, params.subtotal - params.discountAmount);
  const gst = Math.round(taxableAmount * GST_RATE);
  const total = taxableAmount + gst;

  return {
    subtotal: params.subtotal,
    discount: params.discountAmount,
    taxableAmount,
    gst,
    total
  };
}

/**
 * Formats paise into a localized INR string.
 */
export function formatPrice(paise: number): string {
  return (paise / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  });
}
