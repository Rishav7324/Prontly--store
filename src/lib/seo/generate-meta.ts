import { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';
const DEFAULT_OG_IMAGE = 'https://cdn.prontly.in/App%20icon/file_000000004a28720bab301fc1f3a5edb6.png';

interface GenerateMetaProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  price?: number;
  category?: string;
  noIndex?: boolean;
  type?: 'website' | 'article' | 'product';
}

/**
 * Generates automated production SEO Metadata for any page.
 * Uses dynamic high-conversion OpenGraph cards for products and direct images for standard pages.
 */
export function generateMeta({
  title,
  description,
  path,
  image,
  price,
  category,
  noIndex = false,
  type = 'website',
}: GenerateMetaProps): Metadata {
  const fullTitle = `${title} | Prontly`.slice(0, 60);
  const canonical = `${SITE_URL}${path.startsWith('/') ? path : '/' + path}`;
  
  // Construct dynamic viral OpenGraph image URL for products
  let ogImageUrl = image || DEFAULT_OG_IMAGE;
  if (type === 'product') {
    const params = new URLSearchParams({
      title: title.slice(0, 70),
      category: category || 'Digital Asset',
      type: 'Asset',
    });
    if (price) {
      params.set('price', ((price || 0) / 100).toLocaleString('en-IN'));
    }
    if (image && image.startsWith('http')) {
      params.set('image', image);
    }
    ogImageUrl = `${SITE_URL}/api/og?${params.toString()}`;
  }

  const ogType = type === 'article' ? 'article' : 'website';

  return {
    title: fullTitle,
    description: description.slice(0, 160),
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical,
    },
    robots: noIndex 
      ? { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      title: fullTitle,
      description: description.slice(0, 160),
      url: canonical,
      siteName: 'Prontly Store',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        }
      ],
      locale: 'en_IN',
      type: ogType,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: description.slice(0, 160),
      site: '@prontly',
      creator: '@prontly',
      images: [ogImageUrl],
    },
  };
}
