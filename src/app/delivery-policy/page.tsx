import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { generateMeta } from '@/lib/seo/generate-meta';

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "Digital Delivery & Download Policy",
    description: "Learn how your digital assets are delivered instantly via secure download links at Prontly Store.",
    path: '/delivery-policy'
  });
}

export default function DeliveryPolicy() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-20 max-w-3xl">
        <h1 className="text-4xl font-bold font-headline mb-4">Digital Delivery Policy</h1>
        <p className="text-muted-foreground mb-8 text-sm italic">Last updated: May 20, 2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Instant Digital Access</h2>
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
              <li>You will be redirected to a confirmation page with secure download links.</li>
              <li>An automated email containing the download instructions will be sent to your registered email address from <strong>store.support@prontly.in</strong>.</li>
              <li>Logged-in users can access all their purchases anytime through the <strong>My Library</strong> section of their dashboard.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Perpetual Licensing</h2>
            <p className="text-muted-foreground leading-relaxed">
              Purchased digital assets come with a perpetual license for use. You can re-download your source files at any time from your account dashboard, ensuring you never lose access to your tools.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Support & Troubleshooting</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you encounter any issues with file extraction or download links, please contact <a href="mailto:store.support@prontly.in" className="text-primary hover:underline">store.support@prontly.in</a>. We guarantee a response and resolution within 24 hours.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
