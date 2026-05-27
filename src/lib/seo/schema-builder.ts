/**
 * @fileOverview SEO Schema Builder for JSON-LD Structured Data
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';
const BRAND_NAME = 'Prontly Store';
const LOGO_URL = 'https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png';

/**
 * Site-wide WebSite and Organization Schema
 */
export function getGlobalSchema() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: BRAND_NAME,
      url: SITE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/products?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: BRAND_NAME,
      url: SITE_URL,
      logo: LOGO_URL,
      sameAs: [
        'https://twitter.com/prontly',
        'https://github.com/prontly',
        'https://instagram.com/prontly',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'support@prontly.in',
        contactType: 'customer service',
      },
    },
  ];
}

/**
 * Product-specific Schema
 */
export function getProductSchema(product: any, reviews: any[] = []) {
  const price = (product.price / 100).toFixed(2);
  const imageUrl = product.images?.[0] || product.bannerImage || LOGO_URL;
  const productUrl = `${SITE_URL}/products/${product.slug || product.id}`;

  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: imageUrl,
    description: product.shortDescription || product.description?.replace(/<[^>]*>?/gm, '').slice(0, 160),
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: BRAND_NAME,
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'INR',
      price: price,
      availability: product.isActive !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: BRAND_NAME,
      },
    },
    category: product.categorySlug,
  };

  // Add Aggregate Rating if data exists
  if (product.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating || '5.0',
      reviewCount: product.reviewCount,
      bestRating: '5',
      worstRating: '1',
    };
  }

  // Add individual reviews if provided
  if (reviews && reviews.length > 0) {
    schema.review = reviews.map((r: any) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: r.userName || 'Verified Buyer',
      },
      datePublished: r.createdAt,
      reviewBody: r.comment,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating || 5,
        bestRating: '5',
        worstRating: '1',
      },
    }));
  }

  return schema;
}

/**
 * Breadcrumb Schema
 */
export function getBreadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

/**
 * Blog Posting Schema
 */
export function getBlogSchema(post: any) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    image: post.featuredImage || LOGO_URL,
    author: {
      '@type': 'Organization',
      name: BRAND_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: BRAND_NAME,
      logo: {
        '@type': 'ImageObject',
        url: LOGO_URL,
      },
    },
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt || post.publishedAt || post.createdAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/blog/${post.slug}`,
    },
  };
}

/**
 * Collection Page Schema for Listings
 */
export function getCollectionSchema(categoryName: string, products: any[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: categoryName,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.map((p, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/products/${p.slug || p.id}`,
      })),
    },
  };
}
