import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { generateMeta } from '@/lib/seo/generate-meta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare, MapPin, Clock, Send, ShieldCheck } from 'lucide-react';

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "Contact Support — Prontly Store",
    description: "Get in touch with Prontly's support team for inquiries regarding digital assets, licensing, or technical assistance.",
    path: '/contact'
  });
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 pt-28 pb-14 max-w-6xl">
        <header className="max-w-2xl mb-10">
          <Badge variant="outline" className="mb-2 text-[10px] font-medium border-primary/50 text-primary px-2 py-0">
            Support Center
          </Badge>
          <h1 className="text-lg md:text-xl font-semibold font-headline mb-3 leading-snug tracking-tight text-midnight-ink">
            Get in <span className="text-primary">Touch.</span>
          </h1>
          <p className="text-sm text-slate-blue leading-relaxed">
            Have a question about an asset or need technical assistance? Our team typically responds to all inquiries within 24 hours.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Contact Form */}
          <div className="lg:col-span-7">
            <div className="rounded-xl shadow-sm p-4 md:p-6 bg-card border">
              <form className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-medium text-muted-foreground">Full Name</Label>
                    <Input placeholder="John Doe" className="h-9 rounded-lg text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-medium text-muted-foreground">Email Address</Label>
                    <Input type="email" placeholder="name@domain.com" className="h-9 rounded-lg text-xs" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-muted-foreground">Subject</Label>
                  <Input placeholder="Regarding License #..." className="h-9 rounded-lg text-xs" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium text-muted-foreground">Your Message</Label>
                  <Textarea placeholder="How can we assist your workflow?" className="min-h-[140px] rounded-lg text-xs resize-none" />
                </div>

                <Button className="w-full h-9 rounded-lg text-xs font-medium group">
                  Dispatch Message
                  <Send className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Button>

                <div className="flex items-center justify-center gap-1.5 pt-2 opacity-60">
                  <ShieldCheck className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-medium text-muted-foreground">Secure SSL Submission</span>
                </div>
              </form>
            </div>
          </div>

          {/* Contact Details */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl shadow-sm border bg-card divide-y divide-border/60">
              {[
                {
                  icon: Mail,
                  label: "Email",
                  value: "support@prontly.in",
                  desc: "For all technical and licensing inquiries."
                },
                {
                  icon: MapPin,
                  label: "Headquarters",
                  value: "Patna, Bihar",
                  desc: "Digital Fulfillment Node — Bihar, India"
                },
                {
                  icon: Clock,
                  label: "Working Hours",
                  value: "Mon — Fri",
                  desc: "10:00 AM — 18:00 PM IST"
                }
              ].map((item, i) => (
                <div key={i} className="flex gap-3 items-start p-4 first:rounded-t-xl last:rounded-b-xl hover:bg-muted/20 transition-colors">
                  <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                    <item.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-[10px] font-medium text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-semibold text-midnight-ink truncate">{item.value}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl shadow-sm border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                <h4 className="text-sm font-semibold text-midnight-ink">Emergency Recovery</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If you have lost access to your account or are unable to retrieve your purchased digital library, please include your Order ID and original email address in your request.
              </p>
              <Button variant="outline" className="w-full h-9 rounded-lg text-xs font-medium" asChild>
                <a href="mailto:support@prontly.in">Launch Priority Email</a>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
