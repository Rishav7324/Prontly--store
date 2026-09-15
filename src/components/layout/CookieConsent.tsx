'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleConsent = (type: 'all' | 'necessary') => {
    localStorage.setItem('cookieConsent', type);
    setShowBanner(false);
    window.dispatchEvent(new Event('cookie-consent-updated'));
    
    // If user accepted all, we reload to trigger GA4 + Meta Pixel scripts which check localStorage
    if (type === 'all') {
      window.location.reload();
    }
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] border-t bg-background/95 p-6 backdrop-blur-md shadow-2xl animate-in slide-in-from-bottom-full duration-500">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h4 className="font-bold font-headline text-lg">Cookie Preferences</h4>
            <p className="max-w-3xl text-sm text-muted-foreground leading-relaxed">
              We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking &quot;Accept All&quot;, you consent to our use of cookies. Read our <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link> for details.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" size="sm" onClick={() => handleConsent('necessary')}>
              Necessary Only
            </Button>
            <Button size="sm" onClick={() => handleConsent('all')}>
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
