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
export function calculatePriceBreakdown(subtotal: number, discount: number = 0): PriceBreakdown {
  const taxableAmount = Math.max(0, subtotal - discount);
  const gst = Math.round(taxableAmount * GST_RATE);
  const total = taxableAmount + gst;

  return {
    subtotal,
    discount,
    taxableAmount,
    gst,
    total
  };
}

/**
 * Formats paise into a localized INR string.
 */
export function formatCurrency(paise: number): string {
  return (paise / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  });
}
