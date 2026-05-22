'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-20 max-w-3xl">
        <h1 className="text-4xl font-bold font-headline mb-4">Terms of Service</h1>
        <p className="text-muted-foreground mb-8 text-sm italic">Last updated: May 20, 2024</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Prontly Store (store.prontly.in), you agree to be bound by these Terms of Service. If you do not agree to these terms, please refrain from using the store.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Digital Products</h2>
            <p className="text-muted-foreground leading-relaxed">
              Prontly Store sells digital products (AI prompts, UI kits, templates, etc.). All sales are final. Since digital goods are delivered instantly upon payment, they cannot be "returned." 
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Prohibited Use</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are strictly prohibited from:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Reselling, redistributing, or sharing purchased digital products with non-purchasers.</li>
              <li>Claiming ownership or authorship of the source files.</li>
              <li>Using automated tools to scrape or mass-download our catalog.</li>
              <li>Using our assets to train competitive AI models without explicit permission.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Licensing</h2>
            <p className="text-muted-foreground leading-relaxed">
              Each purchase grants you a Personal Use License unless otherwise stated. This allows you to use the assets in your personal or internal business projects. Commercial redistribution licenses are available for specific enterprise-tier products.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content, including text, designs, and code provided on Prontly Store, is the property of Prontly. Your purchase provides a non-exclusive license to use the product, not ownership of the underlying IP.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Prontly is not liable for any indirect, incidental, or consequential damages resulting from the use of our digital assets. Our maximum liability for any claim is limited to the amount paid for the specific product in question.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Patna, Bihar.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
