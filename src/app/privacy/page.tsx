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
        <h1 className="text-4xl font-bold font-headline mb-4 text-foreground">Privacy Policy</h1>
        <p className="text-muted-foreground mb-12 text-sm italic">Last updated: May 20, 2026</p>

        <div className="prose-content space-y-10">
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">1. Data Collection & DPDPA 2023 Compliance</h2>
            <p>
              In accordance with India's <strong>Digital Personal Data Protection Act (DPDPA) 2023</strong>, we act as a <strong>Data Fiduciary</strong> for the information you provide. We collect only the minimum personal data required to fulfill your digital orders and provide perpetual library access.
            </p>
            <p>The categories of data we collect include:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Identity Data:</strong> Name and email address used for account creation and verification.</li>
              <li><strong>Transaction Data:</strong> Details about payments made through Razorpay (we do not store raw credit card numbers).</li>
              <li><strong>Usage Data:</strong> Logged download history and digital library access records to ensure license compliance.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">2. Purpose of Processing</h2>
            <p>
              Your data is processed strictly based on your consent or for legitimate business purposes as defined under Indian law:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide instant electronic fulfillment of digital assets.</li>
              <li>To maintain your perpetual download license in your account dashboard.</li>
              <li>To comply with statutory financial reporting, including GST and income tax regulations.</li>
              <li>To prevent unauthorized redistribution or fraudulent use of our digital property.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">3. Data Principal Rights</h2>
            <p>
              Under DPDPA 2023, you (the <strong>Data Principal</strong>) have the following rights:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Right to Access:</strong> Request a summary of the personal data we process about you.</li>
              <li><strong>Right to Correction:</strong> Update or correct inaccurate personal information.</li>
              <li><strong>Right to Erasure:</strong> Request the deletion of your account and data, subject to legal retention requirements for financial records.</li>
              <li><strong>Right to Grievance Redressal:</strong> Register a complaint regarding our data handling practices.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">4. Data Localisation & Security</h2>
            <p>
              Your personal data is stored securely using cloud infrastructure provided by Firebase (Google Cloud). Transaction records are retained for a minimum of 7 years as required by Indian taxation laws. We use industry-standard encryption to protect your information from unauthorized access or disclosure.
            </p>
          </section>

          <section className="p-8 bg-muted/30 rounded-2xl border border-stone-gray/10">
            <h2 className="text-xl font-bold mb-4 text-foreground">5. Grievance Redressal Officer</h2>
            <p className="text-sm leading-relaxed">
              If you have any questions or wish to exercise your data rights, please contact our designated Grievance Officer:
            </p>
            <div className="mt-4 text-sm font-bold">
              <p>Email: <a href="mailto:privacy@store.prontly.in" className="text-primary hover:underline">privacy@store.prontly.in</a></p>
              <p>Subject: Data Privacy Grievance</p>
            </div>
            <p className="mt-4 text-xs text-muted-foreground italic">
              We aim to acknowledge all grievances within 48 hours and provide a resolution within 30 days.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
