
import { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';

interface GenerateMetaProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
  type?: 'website' | 'article' | 'product';
}

/**
 * Generates production-grade SEO Metadata for Prontly Store.
 * Integrates OpenGraph, Twitter Cards, and dynamic Edge-generated images.
 */
export function generateMeta({
  title,
  description,
  path,
  image,
  noIndex = false,
  type = 'website',
}: GenerateMetaProps): Metadata {
  const fullTitle = `${title} | Prontly Store`.slice(0, 60);
  const canonical = `${SITE_URL}${path}`;
  
  // Use our dynamic OG generator if no direct image is provided or for consistent branding
  const dynamicOgUrl = new URL(`${SITE_URL}/api/og`);
  dynamicOgUrl.searchParams.set('title', title);
  dynamicOgUrl.searchParams.set('type', type === 'product' ? 'Digital Asset' : 'Article');
  
  // Platforms prefer absolute URLs for images
  const ogImageUrl = image?.startsWith('http') ? image : dynamicOgUrl.toString();

  // Next.js Metadata validation only allows specific OGP types. 
  // 'product' is mapped to 'website' to prevent runtime errors.
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
        },
      ],
      locale: 'en_US',
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
