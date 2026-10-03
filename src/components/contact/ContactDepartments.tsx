'use client';

import { useState } from 'react';
import {
  Mail,
  MessageSquare,
  CreditCard,
  Download,
  ShieldCheck,
  Scale,
  Copy,
  Check,
  ExternalLink,
  Clock,
  MapPin,
  Send,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

interface Department {
  id: string;
  name: string;
  email: string;
  subject: string;
  badge: string;
  icon: any;
  desc: string;
  sla: string;
}

const DEPARTMENTS: Department[] = [
  {
    id: 'support',
    name: 'General & Technical Support',
    email: 'support@store.prontly.in',
    subject: 'Support Request - Prontly Store',
    badge: 'Help Desk',
    icon: MessageSquare,
    desc: 'Asset implementation, technical troubleshooting, account access, and general questions.',
    sla: 'Within 24 hours',
  },
  {
    id: 'billing',
    name: 'Billing, Payments & Invoices',
    email: 'billing@store.prontly.in',
    subject: 'Billing Inquiry - Order #',
    badge: 'Finance Desk',
    icon: CreditCard,
    desc: 'Razorpay transactions, GST tax invoices, refund processing, and duplicate charge reviews.',
    sla: 'Within 24 hours',
  },
  {
    id: 'delivery',
    name: 'Digital Delivery & Vault Access',
    email: 'delivery@store.prontly.in',
    subject: 'Download Assistance - Order #',
    badge: 'Fulfillment',
    icon: Download,
    desc: 'Instant Cloudflare R2 download links, file extraction help, rate limit resets, and missing assets.',
    sla: 'Fast turnaround (12-24h)',
  },
  {
    id: 'legal',
    name: 'Legal, Licensing & Compliance',
    email: 'legal@store.prontly.in',
    subject: 'Legal / Licensing Notice - Prontly Store',
    badge: 'Compliance',
    icon: Scale,
    desc: 'Commercial licensing terms, DPDPA 2023 / GDPR privacy rights, copyright & DMCA notices.',
    sla: 'Formal review within 48h',
  },
];

export function ContactDepartments() {
  const [selectedDept, setSelectedDept] = useState<string>('support');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeDepartment = DEPARTMENTS.find((d) => d.id === selectedDept) || DEPARTMENTS[0];

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    toast({
      title: 'Email Copied!',
      description: `${email} has been copied to your clipboard.`,
    });
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !senderEmail.trim() || !message.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Please fill in all required fields before submitting.',
      });
      return;
    }

    setIsSubmitting(true);

    // Form direct mailto launcher with prefilled body
    const emailSubject = encodeURIComponent(subject.trim() || `[${activeDepartment.name}] Inquiry from ${name}`);
    const emailBody = encodeURIComponent(
      `Hello ${activeDepartment.name} Team,\n\n${message}\n\n---\nSender Details:\nName: ${name}\nEmail: ${senderEmail}\nDepartment: ${activeDepartment.name} (${activeDepartment.email})\nSent via: store.prontly.in/contact`
    );

    window.location.href = `mailto:${activeDepartment.email}?subject=${emailSubject}&body=${emailBody}`;

    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: 'Email Client Opened!',
        description: `Your message has been prepared for ${activeDepartment.email}.`,
      });
    }, 1000);
  };

  return (
    <div className="space-y-12">
      
      {/* ── 1. OFFICIAL DEPARTMENT DIRECT INBOX CARDS ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold font-headline text-foreground tracking-tight">
              Direct Department Inboxes
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Contact our specialized teams directly for the fastest resolution.
            </p>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex text-[11px] font-mono border-emerald-500/40 text-emerald-600 bg-emerald-500/5">
            4 Dedicated Desks
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEPARTMENTS.map((dept) => {
            const Icon = dept.icon;
            const isCopied = copiedEmail === dept.email;
            return (
              <div
                key={dept.id}
                className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-sm text-foreground">{dept.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] font-mono font-semibold px-2 py-0.5">
                      {dept.badge}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {dept.desc}
                  </p>
                </div>

                {/* Email address bar with quick copy & direct launch */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyEmail(dept.email)}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-primary hover:text-primary/80 transition-colors group"
                    title="Click to copy email address"
                  >
                    <span>{dept.email}</span>
                    {isCopied ? (
                      <Check className="h-3 w-3 text-emerald-600" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                  </button>

                  <a
                    href={`mailto:${dept.email}?subject=${encodeURIComponent(dept.subject)}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 text-[11px] font-medium transition-colors shadow-2xs shrink-0"
                  >
                    <span>Email Desk</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 2. INTERACTIVE CONTACT FORM WITH DEPARTMENT SELECTOR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-4 border-t border-border/60">
        
        {/* Left Column: Dispatch Form */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl shadow-sm p-5 md:p-7 bg-card border border-border/80 space-y-5">
            <div>
              <h3 className="text-base md:text-lg font-bold font-headline text-foreground">
                Dispatch an In-App Message
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select your intended department to automatically route your inquiry.
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              {/* Department Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Target Department <span className="text-rose-500">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {DEPARTMENTS.map((dept) => {
                    const isSelected = selectedDept === dept.id;
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => setSelectedDept(dept.id)}
                        className={`text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-primary bg-primary/5 text-primary font-bold shadow-2xs ring-1 ring-primary/20'
                            : 'border-border/80 bg-background text-muted-foreground hover:bg-muted/40 font-medium'
                        }`}
                      >
                        <span className="truncate">{dept.badge}</span>
                        {isSelected && <Check className="h-3 w-3 shrink-0 text-primary ml-1" />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] font-mono text-muted-foreground pt-0.5">
                  Routing to: <strong className="text-primary">{activeDepartment.email}</strong>
                </p>
              </div>

              {/* Sender Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="contact-name" className="text-xs font-semibold text-foreground">
                    Full Name <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="contact-name"
                    required
                    placeholder="e.g. Alex Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9.5 rounded-lg text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-email" className="text-xs font-semibold text-foreground">
                    Email Address <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    className="h-9.5 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <Label htmlFor="contact-subject" className="text-xs font-semibold text-foreground">
                  Subject Line
                </Label>
                <Input
                  id="contact-subject"
                  placeholder={`e.g. Question regarding ${activeDepartment.name}`}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-9.5 rounded-lg text-xs"
                />
              </div>

              {/* Message Content */}
              <div className="space-y-1.5">
                <Label htmlFor="contact-message" className="text-xs font-semibold text-foreground">
                  Your Message <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  id="contact-message"
                  required
                  placeholder="Describe your inquiry, order number, or requirements in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[130px] rounded-lg text-xs resize-none leading-relaxed"
                />
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 rounded-xl text-sm font-bold group shadow-sm bg-zinc-950 text-white hover:bg-zinc-800"
              >
                <span>Dispatch to {activeDepartment.badge} ({activeDepartment.email})</span>
                <Send className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Button>

              <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-muted-foreground font-medium">
                <ShieldCheck className="h-3 w-3  text-emerald-600" />
                <span>256-Bit SSL Protected Communication</span>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Node Info & SLA */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Operations & Location Info */}
          <div className="rounded-2xl shadow-xs border border-border/80 bg-card divide-y divide-border/60">
            <div className="flex gap-3 items-start p-4 hover:bg-muted/20 transition-colors rounded-t-2xl">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 text-primary">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Headquarters Node</p>
                <p className="text-xs sm:text-sm font-bold text-foreground">Patna, Bihar, India</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Prontly Technologies — Digital Asset Marketplace Operations
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start p-4 hover:bg-muted/20 transition-colors">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 text-primary">
                <Clock className="h-4 w-4" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Response Window</p>
                <p className="text-xs sm:text-sm font-bold text-foreground">Mon — Sat (10:00 — 19:00 IST)</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Urgent download & payment inquiries are monitored 24/7.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start p-4 hover:bg-muted/20 transition-colors rounded-b-2xl">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20 text-emerald-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono">Resolution SLA</p>
                <p className="text-xs sm:text-sm font-bold text-foreground">Guaranteed 24-Hour Reply</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Every ticket receives personalized engineer attention.
                </p>
              </div>
            </div>
          </div>

          {/* Emergency Recovery Card */}
          <div className="rounded-2xl shadow-xs border border-border/80 bg-zinc-950 text-white p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-200">
                Instant Order & Vault Recovery
              </h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Lost your download link or need immediate invoice retrieval? Email our automated delivery node with your registered checkout email:
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 rounded-xl text-xs font-bold bg-white text-zinc-950 hover:bg-zinc-100 border-0"
              asChild
            >
              <a href="mailto:delivery@store.prontly.in?subject=Vault%20Recovery%20Request">
                <span>Contact delivery@store.prontly.in</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </a>
            </Button>
          </div>

        </div>

      </div>

    </div>
  );
}
