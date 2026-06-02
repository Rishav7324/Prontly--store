import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { generateMeta } from '@/lib/seo/generate-meta';

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "Terms of Service",
    description: "Read the official terms and conditions for using Prontly Store, governed by the laws of India.",
    path: '/terms'
  });
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-20 max-w-3xl">
        <h1 className="text-4xl font-bold font-headline mb-4 text-midnight-ink">Terms of Service</h1>
        <p className="text-muted-foreground mb-12 text-sm italic">Last updated: May 20, 2026</p>

        <div className="prose-content space-y-10">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-midnight-ink">1. Agreement to Terms</h2>
            <p>
              By accessing Prontly Store (store.prontly.in), you agree to comply with these Terms of Service. These terms constitute a legally binding agreement between you and Prontly, governed by the <strong>Information Technology Act, 2000</strong> and the <strong>Consumer Protection (E-Commerce) Rules, 2020</strong> of India.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-midnight-ink">2. Digital Product Licensing</h2>
            <p>
              Prontly Store provides digital assets including AI prompts, templates, and code. When you purchase an asset:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You are granted a <strong>non-exclusive, perpetual personal use license</strong>.</li>
              <li>You may use the assets in your personal projects or internal business workflows.</li>
              <li>You <strong>cannot</strong> resell, redistribute, or share the source files with third parties.</li>
              <li>Ownership of the underlying Intellectual Property (IP) remains with Prontly.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-midnight-ink">3. User Conduct & Prohibited Uses</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use our assets for any illegal activities under Indian law.</li>
              <li>Attempt to scrape, reverse-engineer, or mass-download our catalog using automated tools.</li>
              <li>Claim authorship or original ownership of any purchased source files.</li>
              <li>Use the assets to train competitive generative AI models without written consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-midnight-ink">4. Payments & Fulfillment</h2>
            <p>
              All payments are processed securely through Razorpay. Upon successful payment verification, assets are delivered instantly to your digital library. As these are digital goods, "delivery" is considered complete once the download link is generated or the content is accessed.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-midnight-ink">5. Limitation of Liability</h2>
            <p>
              Prontly provides assets "as is" for creative assistance. We are not liable for any indirect, incidental, or consequential damages resulting from the use of our assets. Our total liability for any claim is strictly limited to the amount paid for the specific product in question.
            </p>
          </section>

          <section className="p-8 bg-muted/30 rounded-2xl border border-stone-gray/10">
            <h2 className="text-xl font-bold mb-4 text-midnight-ink">6. Governing Law & Jurisdiction</h2>
            <p className="text-sm leading-relaxed">
              These terms are governed by the laws of India. Any disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the courts located in <strong>Patna, Bihar</strong>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
