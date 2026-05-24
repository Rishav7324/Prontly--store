
import type { Metadata } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';
import { CookieConsent } from '@/components/layout/CookieConsent';
import { getGlobalSchema } from '@/lib/seo/schema-builder';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';

export const metadata: Metadata = {
  title: {
    default: 'Prontly Store | Premium Digital Marketplace',
    template: '%s | Prontly Store'
  },
  description: 'Discover, preview, and purchase high-quality AI prompts, templates, and digital assets.',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'Prontly Store',
    images: [
      {
        url: '/og-default.webp',
        width: 1200,
        height: 630,
        alt: 'Prontly Store'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prontly Store',
    description: 'Premium Digital Asset Marketplace',
    images: ['/og-default.webp'],
    creator: '@prontly'
  }
};

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-MKC3EVCGSH';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const globalSchema = getGlobalSchema();

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@500;600;700&family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet" />
        
        {/* Global Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalSchema) }}
        />

        {/* Google Analytics - Respect Cookie Consent */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            // Function to check consent
            function hasConsent() {
              try {
                return localStorage.getItem('cookieConsent') === 'all';
              } catch (e) {
                return false;
              }
            }

            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            if (hasConsent()) {
              gtag('config', '${GA_MEASUREMENT_ID}');
            } else {
              // Deny tracking if no consent
              gtag('consent', 'default', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied'
              });
            }
          `}
        </Script>
      </head>
      <body className="font-body antialiased selection:bg-primary selection:text-primary-foreground">
        <FirebaseClientProvider>
          {children}
          <Toaster />
          <CookieConsent />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
