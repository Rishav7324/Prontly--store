import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { generateMeta } from '@/lib/seo/generate-meta';

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "Privacy Policy",
    description: "Understand how Prontly Store collects, uses, and protects your data in accordance with India's DPDPA 2023.",
    path: '/privacy'
  });
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-20 max-w-3xl">
        <h1 className="text-4xl font-bold font-headline mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8 text-sm italic">Last updated: May 20, 2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Data Collection & DPDPA Compliance</h2>
            <p className="text-muted-foreground leading-relaxed">
              In accordance with India's Digital Personal Data Protection Act (DPDPA) 2023, we collect only the minimum necessary data to provide our services. We act as a Data Fiduciary for your information.
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Account Info: Name, email address, and verified payment identifiers.</li>
              <li>Usage Data: Download history and digital library access records.</li>
              <li>Cookies: Essential and analytical cookies for store optimization.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Purpose of Processing</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is processed strictly for fulfilling digital orders, providing perpetual library access, and meeting legal financial reporting requirements (including GST compliance).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Data Localisation & Storage</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your transactional data is stored securely using Firebase (Google Cloud) and processed within compliant regions. We retain financial records for 7 years as required by Indian taxation laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Grievance Redressal</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any concerns regarding your data privacy, you may contact our Grievance Officer at <a href="mailto:privacy@store.prontly.in" className="text-primary hover:underline">privacy@store.prontly.in</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
