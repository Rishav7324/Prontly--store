import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { generateMeta } from '@/lib/seo/generate-meta';
import { Badge } from '@/components/ui/badge';
import { ContactDepartments } from '@/components/contact/ContactDepartments';

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "Official Contact & Support Desks — Prontly Store",
    description: "Connect directly with Prontly's dedicated departments: General Support (support@store.prontly.in), Billing (billing@store.prontly.in), Delivery (delivery@store.prontly.in), and Legal (legal@store.prontly.in).",
    path: '/contact'
  });
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 pt-20 md:pt-24 pb-16 max-w-6xl">
        <header className="max-w-3xl mb-8 sm:mb-10">
          <Badge variant="outline" className="mb-2 text-[10px] font-mono font-bold border-primary/50 text-primary px-2.5 py-0.5 uppercase tracking-wider">
            Official Contact Center
          </Badge>
          <h1 className="text-2xl md:text-4xl font-extrabold font-headline mb-3 leading-snug tracking-tight text-foreground">
            How can we assist you <span className="text-primary">today?</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Reach out to our specialized department inboxes directly. Whether it is technical troubleshooting, billing & tax receipts, instant file delivery, or legal licensing inquiries, our teams guarantee a response within 24 hours.
          </p>
        </header>

        {/* Multi-Department Directory & Dispatch Form */}
        <ContactDepartments />
      </main>

      <Footer />
    </div>
  );
}
