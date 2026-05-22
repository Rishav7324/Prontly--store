
'use client';

/**
 * @fileOverview Google Analytics 4 Event Tracking Utility
 */

type GAEvent = 
  | 'page_view' 
  | 'product_view' 
  | 'add_to_cart' 
  | 'begin_checkout' 
  | 'purchase' 
  | 'download_start' 
  | 'search' 
  | 'sign_up';

interface TrackEventProps {
  action: GAEvent;
  params?: Record<string, any>;
}

/**
 * Safely triggers a GA4 event if tracking is accepted by the user.
 */
export function trackEvent({ action, params }: TrackEventProps) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') {
    return;
  }

  // Check for cookie consent before tracking
  const consent = localStorage.getItem('cookieConsent');
  if (consent !== 'all') {
    return;
  }

  window.gtag('event', action, {
    ...params,
    send_to: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-MKC3EVCGSH',
  });
}

/**
 * Specialized trackers for e-commerce flow
 */
export const analytics = {
  viewProduct: (product: any) => {
    trackEvent({
      action: 'product_view',
      params: {
        product_id: product.id,
        product_name: product.name,
        category: product.categorySlug,
        price: product.price / 100,
        currency: 'INR'
      }
    });
  },
  addToCart: (item: any) => {
    trackEvent({
      action: 'add_to_cart',
      params: {
        product_id: item.id,
        product_name: item.name,
        price: item.price / 100,
        currency: 'INR'
      }
    });
  },
  beginCheckout: (total: number, items: any[]) => {
    trackEvent({
      action: 'begin_checkout',
      params: {
        value: total / 100,
        currency: 'INR',
        items: items.map(i => ({ item_id: i.id, item_name: i.name }))
      }
    });
  },
  purchase: (order: any) => {
    trackEvent({
      action: 'purchase',
      params: {
        transaction_id: order.id,
        value: order.total / 100,
        currency: 'INR',
        items: order.items.map((i: any) => ({ item_id: i.productId, item_name: i.productName }))
      }
    });
  },
  search: (term: string, count: number) => {
    trackEvent({
      action: 'search',
      params: {
        search_term: term,
        result_count: count
      }
    });
  }
};
