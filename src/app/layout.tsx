
import type { Metadata } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';
import { CookieConsent } from '@/components/layout/CookieConsent';
import { getGlobalSchema } from '@/lib/seo/schema-builder';
import { WebMCPProvider } from '@/components/ai/WebMCPProvider';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://store.prontly.in';

export const metadata: Metadata = {
  title: {
    default: 'Prontly Store | Premium Digital Marketplace',
    template: '%s | Prontly Store'
  },
  description: 'Discover, preview, and purchase high-quality AI prompts, templates, and digital assets. Professional tools for modern creators.',
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: 'https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png',
    apple: 'https://cdn.prontly.in/App%20icon/IMG_20260518_203511.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: 'Prontly Store',
    description: 'Discover, preview, and purchase high-quality AI prompts, templates, and digital assets.',
    images: [
      {
        url: 'https://cdn.prontly.in/App%20icon/file_000000004a28720bab301fc1f3a5edb6.png',
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
    images: ['https://cdn.prontly.in/App%20icon/file_000000004a28720bab301fc1f3a5edb6.png'],
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
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WSF78RMT');`
          }}
        />
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&family=Story+Script&display=swap" rel="stylesheet" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalSchema) }}
        />

        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
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
              gtag('consent', 'default', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied'
              });
            }
          `}
        </Script>
      </head>
      <body className="antialiased overflow-x-hidden w-full max-w-[100vw] selection:bg-black selection:text-white">
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-WSF78RMT"
            height="0" 
            width="0" 
            style={{ display: 'none', visibility: 'hidden' }}
          ></iframe>
        </noscript>

        <FirebaseClientProvider>
          <WebMCPProvider />
          {children}
          <Toaster />
          <CookieConsent />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
