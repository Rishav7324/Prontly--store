'use client';

/**
 * Meta Pixel (Facebook) event helpers.
 * All events are no-ops unless cookie consent === 'all' and fbq is loaded.
 */

export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || '2972729549785896';

export function hasPixelConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem('cookieConsent') === 'all';
  } catch {
    return false;
  }
}

export function fbTrack(
  event: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string },
) {
  if (typeof window === 'undefined') return;
  if (typeof window.fbq !== 'function') return;
  if (!hasPixelConsent()) return;
  if (options?.eventID) {
    window.fbq('track', event, params || {}, { eventID: options.eventID });
  } else {
    window.fbq('track', event, params || {});
  }
}

export function fbTrackCustom(event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  if (typeof window.fbq !== 'function') return;
  if (!hasPixelConsent()) return;
  window.fbq('trackCustom', event, params || {});
}

/**
 * Standard events mapped to store actions (prices in INR).
 * https://developers.facebook.com/docs/meta-pixel/reference
 */
export const metaPixel = {
  pageView: () => fbTrack('PageView'),

  viewContent: (p: { id: string; name: string; category?: string; value: number }) =>
    fbTrack('ViewContent', {
      content_ids: [p.id],
      content_name: p.name,
      content_category: p.category,
      content_type: 'product',
      value: p.value / 100,
      currency: 'INR',
    }),

  addToCart: (p: { id: string; name: string; value: number }) =>
    fbTrack('AddToCart', {
      content_ids: [p.id],
      content_name: p.name,
      content_type: 'product',
      value: p.value / 100,
      currency: 'INR',
    }),

  initiateCheckout: (value: number, numItems: number) =>
    fbTrack('InitiateCheckout', {
      value: value / 100,
      currency: 'INR',
      num_items: numItems,
    }),

  purchase: (o: {
    id: string;
    value: number;
    items: { id: string; name: string }[];
  }) =>
    fbTrack(
      'Purchase',
      {
        content_ids: o.items.map((i) => i.id),
        content_name: o.items.map((i) => i.name).join(', '),
        content_type: 'product',
        value: o.value / 100,
        currency: 'INR',
      },
      { eventID: o.id },
    ),

  lead: () => fbTrack('Lead'),
  completeRegistration: (method = 'email') =>
    fbTrack('CompleteRegistration', { content_name: method }),
  search: (term: string) => fbTrack('Search', { search_string: term }),
  addToWishlist: (id: string, name: string) =>
    fbTrack('AddToWishlist', {
      content_ids: [id],
      content_name: name,
      content_type: 'product',
    }),
};
