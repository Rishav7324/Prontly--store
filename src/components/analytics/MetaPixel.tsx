'use client';

import { Suspense, useEffect, useState } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { META_PIXEL_ID, hasPixelConsent } from '@/lib/meta-pixel';

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!hasPixelConsent()) return;
    if (typeof window.fbq !== 'function') return;
    window.fbq('track', 'PageView');
  }, [pathname, searchParams]);

  return null;
}

export function MetaPixel() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = () => setAllowed(hasPixelConsent());
    sync();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cookieConsent') sync();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('cookie-consent-updated', sync);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('cookie-consent-updated', sync);
    };
  }, []);

  if (!allowed) return null;

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}
