'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-20 max-w-3xl">
        <h1 className="text-4xl font-bold font-headline mb-4">Refund Policy</h1>
        <p className="text-muted-foreground mb-8 text-sm italic">Last updated: May 20, 2024</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Digital Nature of Goods</h2>
            <p className="text-muted-foreground leading-relaxed">
              Due to the digital nature of our products (AI prompts, templates, code), all sales are considered final once the download has been initiated or the content has been accessed. We do not offer refunds for "change of mind."
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Exceptions for Refunds</h2>
            <p className="text-muted-foreground leading-relaxed">
              We only issue refunds under the following specific circumstances:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>The digital file is corrupted and cannot be opened or read.</li>
              <li>The product is significantly different from what was described on the product page.</li>
              <li>There was a technical failure in our delivery system that prevented you from accessing the file for more than 48 hours.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Refund Process</h2>
            <p className="text-muted-foreground leading-relaxed">
              To request a refund, please email <a href="mailto:support@prontly.in" className="text-primary hover:underline">support@prontly.in</a> within 48 hours of purchase. You must include:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Your Order ID.</li>
              <li>The email address used for the purchase.</li>
              <li>A clear description and evidence of the issue (e.g., screenshots of the corruption).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Processing Time</h2>
            <p className="text-muted-foreground leading-relaxed">
              Approved refunds are processed back to the original payment method via Razorpay. The timeline for the funds to appear in your account is typically 5-7 business days, depending on your bank.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Coupon Codes</h2>
            <p className="text-muted-foreground leading-relaxed">
              Discounts applied via coupon codes are non-refundable and cannot be transferred to other orders.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
