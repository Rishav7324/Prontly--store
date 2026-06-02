import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { generateMeta } from '@/lib/seo/generate-meta';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare, MapPin, Clock, Send, ShieldCheck, ExternalLink } from 'lucide-react';

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
      
      <main className="flex-1 container mx-auto px-4 pt-28 pb-16 max-w-7xl">
        <header className="max-w-3xl mb-16">
          <Badge variant="outline" className="mb-6 border-primary/50 text-primary py-1 px-4 text-sm font-medium rounded-full bg-primary/5">
            Support Center
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold font-headline mb-8 leading-tight tracking-tight text-midnight-ink">
            Get in <span className="text-primary">Touch.</span>
          </h1>
          <p className="text-xl text-slate-blue leading-relaxed font-medium">
            Have a question about an asset or need technical assistance? Our team typically responds to all inquiries within 24 hours.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Contact Form */}
          <div className="lg:col-span-7">
            <div className="p-8 md:p-12 rounded-[2.5rem] bg-white border border-stone-gray/10 shadow-xl">
              <form className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-ghost-gray ml-1">Full Name</Label>
                    <Input placeholder="John Doe" className="h-14 bg-muted/20 border-stone-gray/10 rounded-2xl px-6 text-lg" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-ghost-gray ml-1">Email Address</Label>
                    <Input type="email" placeholder="name@domain.com" className="h-14 bg-muted/20 border-stone-gray/10 rounded-2xl px-6 text-lg" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-ghost-gray ml-1">Subject</Label>
                  <Input placeholder="Regarding License #..." className="h-14 bg-muted/20 border-stone-gray/10 rounded-2xl px-6 text-lg" />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-ghost-gray ml-1">Your Message</Label>
                  <Textarea placeholder="How can we assist your workflow?" className="min-h-[200px] bg-muted/20 border-stone-gray/10 rounded-2xl p-6 text-lg resize-none" />
                </div>

                <Button className="w-full h-16 rounded-2xl text-lg font-bold shadow-2xl shadow-primary/20 transition-all hover:scale-[1.01] group">
                  Dispatch Message
                  <Send className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </Button>
                
                <div className="flex items-center justify-center gap-2 pt-4 opacity-40">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Secure SSL Submission</span>
                </div>
              </form>
            </div>
          </div>

          {/* Contact Details */}
          <div className="lg:col-span-5 space-y-10">
            <div className="space-y-10">
              <div className="flex gap-6 items-start">
                <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-ghost-gray">Electronic Mail</h4>
                  <p className="text-xl font-bold text-midnight-ink">support@prontly.in</p>
                  <p className="text-sm text-slate-blue font-medium">For all technical and licensing inquiries.</p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-ghost-gray">Headquarters</h4>
                  <p className="text-xl font-bold text-midnight-ink">Patna, Bihar</p>
                  <p className="text-sm text-slate-blue font-medium leading-relaxed">
                    Digital Fulfillment Node<br />
                    Bihar, India
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-ghost-gray">Active Cycles</h4>
                  <p className="text-xl font-bold text-midnight-ink">Mon — Fri</p>
                  <p className="text-sm text-slate-blue font-medium">10:00 AM — 18:00 PM IST</p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-[2rem] border border-stone-gray/10 bg-muted/20 space-y-6">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h4 className="text-lg font-bold text-midnight-ink">Emergency Recovery</h4>
              </div>
              <p className="text-sm text-slate-blue leading-relaxed font-medium">
                If you have lost access to your account or are unable to retrieve your purchased digital library, please include your Order ID and original email address in your request.
              </p>
              <Button variant="outline" className="w-full h-12 rounded-xl border-stone-gray/20 font-bold text-xs uppercase" asChild>
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
