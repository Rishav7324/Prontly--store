import { Metadata } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';

interface GenerateMetaProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
}

/**
 * Generates standardized Next.js Metadata objects for Prontly Store pages.
 */
export function generateMeta({
  title,
  description,
  path,
  image,
  noIndex = false,
}: GenerateMetaProps): Metadata {
  const fullTitle = `${title} | Prontly Store`.slice(0, 60);
  const canonical = `${SITE_URL}${path}`;
  const defaultOg = `${SITE_URL}/og-default.png`; // Fallback branded OG image

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
      description,
      url: canonical,
      siteName: 'Prontly Store',
      images: [
        {
          url: image || defaultOg,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      site: '@prontly',
      images: [image || defaultOg],
    },
  };
}
