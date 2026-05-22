'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-20 max-w-3xl">
        <h1 className="text-4xl font-bold font-headline mb-4">Cookie Policy</h1>
        <p className="text-muted-foreground mb-8 text-sm italic">Last updated: May 20, 2024</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. What are Cookies?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookies are small text files stored on your device when you visit a website. They help us remember your preferences, keep you logged in, and understand how you interact with our store.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Types of Cookies We Use</h2>
            <ul className="list-disc pl-6 mt-4 space-y-4 text-muted-foreground">
              <li>
                <strong>Necessary Cookies:</strong> Required for the basic functionality of the store, such as the shopping cart and user authentication. These cannot be disabled.
              </li>
              <li>
                <strong>Preference Cookies:</strong> Allow us to remember your settings, like your preferred language or region.
              </li>
              <li>
                <strong>Analytics Cookies:</strong> Provided by Google Analytics, these help us measure how visitors use the site so we can improve the experience.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Managing Your Choices</h2>
            <p className="text-muted-foreground leading-relaxed">
              When you first visit Prontly Store, you are presented with a cookie consent banner. You can choose to "Accept All" or "Necessary Only." You can also clear your browser's local storage to reset these preferences at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Third-Party Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use Cloudflare and Google Analytics, which may set their own cookies to ensure security and provide traffic reports. These are managed according to the respective privacy policies of those providers.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
