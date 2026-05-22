'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function DeliveryPolicy() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-20 max-w-3xl">
        <h1 className="text-4xl font-bold font-headline mb-4">Shipping & Delivery</h1>
        <p className="text-muted-foreground mb-8 text-sm italic">Last updated: May 20, 2024</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Instant Digital Delivery</h2>
            <p className="text-muted-foreground leading-relaxed">
              Prontly Store exclusively sells digital assets. There is no physical shipping involved. All products are delivered electronically immediately after a successful payment transaction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. How to Access Your Purchase</h2>
            <p className="text-muted-foreground leading-relaxed">
              Once your payment is confirmed by Razorpay:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>You will be redirected to a confirmation page with download links.</li>
              <li>An automated email containing the download links will be sent to your registered email address.</li>
              <li>Logged-in users can access all their purchases anytime through the <strong>My Library</strong> section of their dashboard.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Delivery Issues</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you do not receive an email confirmation or cannot see your purchase in the dashboard within 10 minutes, please check your Spam/Junk folder. If it is still missing, contact <a href="mailto:support@prontly.in" className="text-primary hover:underline">support@prontly.in</a> with your payment receipt.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Technical Requirements</h2>
            <p className="text-muted-foreground leading-relaxed">
              It is the buyer's responsibility to ensure they have the necessary software to open the purchased files (e.g., PDF readers, ZIP extractors, or specific AI model access).
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
