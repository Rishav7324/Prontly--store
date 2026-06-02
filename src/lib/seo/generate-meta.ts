import { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';

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
 * Prioritizes the main product/blog image for social sharing.
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
  const fullTitle = `${title} | Prontly Store`.slice(0, 60);
  const canonical = `${SITE_URL}${path.startsWith('/') ? path : '/' + path}`;
  
  // Generate automated branded OG image URL
  const ogUrl = new URL(`${SITE_URL}/api/og`);
  ogUrl.searchParams.set('title', title);
  ogUrl.searchParams.set('type', type === 'product' ? 'Digital Asset' : type === 'article' ? 'Blog' : 'Platform');
  if (category) ogUrl.searchParams.set('category', category);
  if (price) ogUrl.searchParams.set('price', (price / 100).toString());
  if (image) ogUrl.searchParams.set('image', image);

  const dynamicOgImage = ogUrl.toString();
  const ogType = type === 'article' ? 'article' : 'website';

  // Build the images array, putting the actual main image first if it exists
  const ogImages = [];
  if (image) {
    ogImages.push({
      url: image,
      width: 1200,
      height: 630,
      alt: title,
    });
  }
  ogImages.push({
    url: dynamicOgImage,
    width: 1200,
    height: 630,
    alt: title,
  });

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
      images: ogImages,
      locale: 'en_US',
      type: ogType,
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: description.slice(0, 160),
      site: '@prontly',
      creator: '@prontly',
      images: [image || dynamicOgImage],
    },
  };
}
