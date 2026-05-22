'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-20 max-w-3xl">
        <h1 className="text-4xl font-bold font-headline mb-4">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8 text-sm italic">Last updated: May 20, 2024</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Data Collected</h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect information you provide directly to us when you create an account, make a purchase, or communicate with us. This includes:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Account Info: Name, email address, phone number, and password.</li>
              <li>Business Info: GST number (for B2B customers).</li>
              <li>Usage Data: Purchase history, download activity, and device information.</li>
              <li>Tracking: Cookies and similar technologies to monitor store performance.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. How Data is Used</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is essential for delivering our digital services. We use it to:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Process your orders and verify payments via Razorpay.</li>
              <li>Deliver digital downloads and provide lifetime access to purchased assets.</li>
              <li>Provide customer support and respond to your inquiries.</li>
              <li>Send transaction emails and optional marketing updates (if you opt-in).</li>
              <li>Analyze traffic and usage patterns via Google Analytics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              We rely on trusted third-party providers to operate Prontly Store. Your data may be processed by:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li><strong>Firebase (Google):</strong> For authentication and database hosting.</li>
              <li><strong>Razorpay:</strong> For secure payment processing.</li>
              <li><strong>Cloudflare:</strong> For content delivery, security, and storage.</li>
              <li><strong>Google Analytics:</strong> For anonymous usage tracking.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain account data as long as your account is active. Order records are kept for at least 7 years to comply with Indian GST and financial regulations. Analytics data is automatically deleted after 26 months of inactivity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              Under the Indian Information Technology Act (2000) and equivalent global standards, you have the right to:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-2 text-muted-foreground">
              <li>Access and export your personal data in JSON format.</li>
              <li>Correct any inaccurate information in your profile.</li>
              <li>Request deletion of your data (this will result in account closure).</li>
              <li>Withdraw consent for marketing communications at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For any privacy-related concerns, please reach out to us at <a href="mailto:privacy@prontly.in" className="text-primary hover:underline">privacy@prontly.in</a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
