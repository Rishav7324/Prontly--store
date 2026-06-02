import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { generateMeta } from '@/lib/seo/generate-meta';

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "Refund & Cancellation Policy",
    description: "Official refund policy for digital assets at Prontly Store, aligned with Indian Consumer Protection standards.",
    path: '/refund-policy'
  });
}

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-20 max-w-3xl">
        <h1 className="text-4xl font-bold font-headline mb-4 text-midnight-ink">Refund Policy</h1>
        <p className="text-muted-foreground mb-12 text-sm italic">Last updated: May 20, 2026</p>

        <div className="prose-content space-y-10">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-midnight-ink">1. Nature of Digital Goods</h2>
            <p>
              Due to the digital nature of our products (AI prompts, technical guides, code templates), all sales are considered final. In accordance with the <strong>Consumer Protection Act, 2019</strong>, once the digital content has been accessed or the download has been initiated, the service is deemed to have been provided in full.
            </p>
            <p>We do not offer refunds for "change of mind" or if the product does not meet your subjective expectations after download.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-midnight-ink">2. Exceptions for Refunds</h2>
            <p>We will consider refund requests only under the following limited circumstances:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Asset Corruption:</strong> The digital file is technically corrupted and cannot be opened or utilized as described.</li>
              <li><strong>Major Discrepancy:</strong> The product delivered is fundamentally different from the specifications provided on the product page.</li>
              <li><strong>Delivery Failure:</strong> A technical error in our system prevented you from accessing the asset for more than 48 hours after payment.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-midnight-ink">3. Refund Request Process</h2>
            <p>
              To request a refund, please email <a href="mailto:support@prontly.in" className="text-primary font-bold hover:underline">support@prontly.in</a> within 48 hours of purchase. Your email must include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your Order Reference ID.</li>
              <li>The email address used for the purchase.</li>
              <li>A detailed description of the technical issue, including screenshots if applicable.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-midnight-ink">4. Processing Timeline</h2>
            <p>
              If your refund is approved, the funds will be reversed to your original payment method via Razorpay. According to standard banking cycles in India, it typically takes <strong>5-7 business days</strong> for the amount to reflect in your bank account or credit card statement.
            </p>
          </section>

          <section className="p-8 bg-blue-50/50 rounded-2xl border border-blue-100">
            <h2 className="text-lg font-bold mb-2 text-midnight-ink">Duplicate Purchases</h2>
            <p className="text-sm">
              If you accidentally purchase the same asset twice, please contact us immediately. We will verify the transaction and issue a credit or refund for the duplicate order.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
