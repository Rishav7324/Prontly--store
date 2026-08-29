import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { generateMeta } from '@/lib/seo/generate-meta';

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "Digital Delivery Policy",
    description: "Learn how your digital assets are delivered instantly via secure electronic links at Prontly Store.",
    path: '/delivery-policy'
  });
}

export default function DeliveryPolicy() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-20 max-w-3xl">
        <h1 className="text-4xl font-bold font-headline mb-4 text-foreground">Digital Delivery Policy</h1>
        <p className="text-muted-foreground mb-12 text-sm italic">Last updated: May 20, 2026</p>

        <div className="prose-content space-y-10">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">1. Electronic Fulfillment Only</h2>
            <p>
              Prontly Store operates exclusively as a digital marketplace. There is <strong>no physical shipping</strong> of goods. All products are delivered electronically through secure download links hosted on our Global R2 Edge network.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">2. Delivery Mechanisms</h2>
            <p>Upon successful payment verification by Razorpay, your digital assets are delivered through three parallel channels:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Success Terminal:</strong> You will be immediately redirected to a post-purchase page containing your secure download links.</li>
              <li><strong>Email Dispatch:</strong> An automated confirmation email from <code>delivery@store.prontly.in</code> will be sent to your registered address with access instructions.</li>
              <li><strong>Digital Vault:</strong> Logged-in users can access all current and past purchases anytime through the <strong>My Library</strong> section of the account dashboard.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">3. Delivery Timeline</h2>
            <p>
              Fulfillment is designed to be <strong>instant</strong>. In rare cases where Razorpay payment verification is delayed, delivery may take up to 30 minutes. If you have not received access within 1 hour of payment, please contact our support team.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">4. Licensing & Usage</h2>
            <p>
              Each purchase includes a perpetual license record. You are entitled to re-download your assets at any time from your dashboard, subject to a standard security limit of 5 downloads per hour to prevent account abuse. If your download limit is reached, please contact support for a manual reset.
            </p>
          </section>

          <section className="p-8 bg-muted/30 rounded-2xl border border-stone-gray/10">
            <h2 className="text-xl font-bold mb-4 text-foreground">5. Support & Troubleshooting</h2>
            <p className="text-sm leading-relaxed">
              If you encounter technical difficulties extracting files or accessing links, please email <a href="mailto:support@prontly.in" className="text-primary font-bold hover:underline">support@prontly.in</a>. We guarantee a response and technical resolution within 24 hours.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
