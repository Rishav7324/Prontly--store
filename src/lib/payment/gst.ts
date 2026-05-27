/**
 * @fileOverview Price Calculation Engine for Prontly Store.
 * Direct pricing model without indirect taxes.
 */

export interface PriceBreakdown {
  subtotal: number;      // in paise
  discount: number;      // in paise
  taxableAmount: number; // subtotal - discount
  gst: number;           // Always 0
  total: number;         // taxableAmount
}

/**
 * Calculates the full price breakdown. GST is now removed.
 */
export function calculatePriceBreakdown(params: {
  subtotal: number;
  discountAmount: number;
}): PriceBreakdown {
  const taxableAmount = Math.max(0, params.subtotal - params.discountAmount);
  
  return {
    subtotal: params.subtotal,
    discount: params.discountAmount,
    taxableAmount,
    gst: 0,
    total: taxableAmount
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
