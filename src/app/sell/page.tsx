'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser, useAuth } from '@/firebase';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Sparkles,
  Upload,
  CheckCircle2,
  Clock,
  DollarSign,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Loader2,
  FileCode,
  Image as ImageIcon
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function CreatorSellPage() {
  const { user } = useUser();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    categorySlug: 'ai-prompts',
    price: '299',
    shortDescription: '',
    description: '',
    targetModel: 'Midjourney v6',
    promptTemplate: '',
    imageUrl: '',
  });

  const { data: mySubmissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: ['my-submissions', user?.uid],
    queryFn: async () => {
      if (!auth?.currentUser) return [];
      const token = await auth.currentUser.getIdToken();
      const res = await fetch('/api/submissions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: !!user,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: "destructive", title: "Sign in required", description: "Please sign in to list your prompts." });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          categorySlug: formData.categorySlug,
          price: formData.price,
          shortDescription: formData.shortDescription,
          description: `<h3>Target Model: ${formData.targetModel}</h3><p>${formData.description}</p><h4>Prompt Template</h4><pre><code>${formData.promptTemplate}</code></pre>`,
          images: formData.imageUrl ? [formData.imageUrl] : [],
          tags: [formData.categorySlug, formData.targetModel],
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Submission failed');

      toast({
        title: "Prompt Submitted for Review!",
        description: "Our curation team will review and approve your listing within 24 hours.",
      });

      setFormData({
        name: '',
        categorySlug: 'ai-prompts',
        price: '299',
        shortDescription: '',
        description: '',
        targetModel: 'Midjourney v6',
        promptTemplate: '',
        imageUrl: '',
      });

      queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Submission Failed", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background selection:bg-accent/20 selection:text-accent">
      <Navbar />

      <main className="container-page pt-20 sm:pt-24 pb-24 flex-1 w-full max-w-6xl">
        
        {/* ── HERO BANNER ──────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-8 sm:p-12 text-white shadow-xl mb-12">
          <div className="absolute -top-24 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/20 border border-accent/40 px-3 py-1 text-xs font-bold text-accent">
              <Sparkles className="h-3.5 w-3.5" /> CREATOR MARKETPLACE
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-headline leading-tight">
              Monetize Your Tested AI Prompts & Assets
            </h1>
            <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
              Join top prompt engineers and designers. Publish your verified prompts, reach thousands of buyers, and earn passive royalties on every download.
            </p>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-white font-headline">85%</p>
                <p className="text-zinc-400 text-[11px]">Creator Payout</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-white font-headline">Instant</p>
                <p className="text-zinc-400 text-[11px]">Automated Delivery</p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-extrabold text-white font-headline">₹0</p>
                <p className="text-zinc-400 text-[11px]">Listing Fees</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── FORM & SUBMISSIONS GRID ──────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Submission Form */}
          <div className="lg:col-span-7">
            <Card className="rounded-3xl border border-border/80 bg-white shadow-xs p-6 sm:p-8">
              <CardHeader className="p-0 pb-6 border-b border-border/60">
                <CardTitle className="text-xl font-bold font-headline text-foreground">
                  Submit New Prompt / Template
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1">
                  Fill in the details below. Our team reviews every asset for quality and reproducibility.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmit} className="p-0 pt-6 space-y-5">
                
                {/* Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-bold text-foreground">Prompt / Asset Title *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Hyper-Realistic Cinematic Portrait Generator v6"
                    className="h-11 rounded-xl text-xs"
                    required
                  />
                </div>

                {/* Category & Model */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="category" className="text-xs font-bold text-foreground">Category *</Label>
                    <select
                      id="category"
                      value={formData.categorySlug}
                      onChange={(e) => setFormData({ ...formData, categorySlug: e.target.value })}
                      className="w-full h-11 rounded-xl border border-border/80 bg-white px-3 text-xs font-medium focus:ring-1 focus:ring-accent outline-none"
                    >
                      <option value="ai-prompts">Midjourney & Image Prompts</option>
                      <option value="chatgpt-prompts">ChatGPT & Claude Prompts</option>
                      <option value="templates">Developer & Notion Templates</option>
                      <option value="ui-kits">UI & Design Kits</option>
                      <option value="video-prompts">Video & Animation Prompts</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="model" className="text-xs font-bold text-foreground">Target AI Model *</Label>
                    <Input
                      id="model"
                      value={formData.targetModel}
                      onChange={(e) => setFormData({ ...formData, targetModel: e.target.value })}
                      placeholder="Midjourney v6.1 / GPT-4o / Claude 3.5"
                      className="h-11 rounded-xl text-xs"
                      required
                    />
                  </div>
                </div>

                {/* Price in INR */}
                <div className="space-y-1.5">
                  <Label htmlFor="price" className="text-xs font-bold text-foreground">Listing Price (INR ₹) *</Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₹</span>
                    <Input
                      id="price"
                      type="number"
                      min="49"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="pl-8 h-11 rounded-xl text-xs font-bold font-headline"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">You earn ~85% (₹{Math.round(Number(formData.price || 0) * 0.85)}) after gateway fees.</p>
                </div>

                {/* Short Tagline */}
                <div className="space-y-1.5">
                  <Label htmlFor="shortDescription" className="text-xs font-bold text-foreground">Short Tagline (1-2 sentences)</Label>
                  <Input
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    placeholder="Generates 8K hyper-detailed photorealistic portraits with custom lighting."
                    className="h-11 rounded-xl text-xs"
                  />
                </div>

                {/* Prompt Template with Variables */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="promptTemplate" className="text-xs font-bold text-foreground">Full Prompt Template & Instructions *</Label>
                    <span className="text-[10px] text-muted-foreground font-mono">Use [variables]</span>
                  </div>
                  <Textarea
                    id="promptTemplate"
                    rows={4}
                    value={formData.promptTemplate}
                    onChange={(e) => setFormData({ ...formData, promptTemplate: e.target.value })}
                    placeholder="e.g. /imagine prompt: A high-fashion editorial portrait of [subject], illuminated by [lighting_style], 8k resolution, shot on Hasselblad --ar 16:9 --v 6.0"
                    className="rounded-xl text-xs font-mono"
                    required
                  />
                </div>

                {/* Sample Output Image URL */}
                <div className="space-y-1.5">
                  <Label htmlFor="imageUrl" className="text-xs font-bold text-foreground">Sample Result Image URL</Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/... or CDN link"
                    className="h-11 rounded-xl text-xs font-mono"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-2xl font-bold text-xs sm:text-sm bg-zinc-950 text-white hover:bg-zinc-800 shadow-md active:scale-[0.98] transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Listing…
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Submit for Curation Review
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Right Column: Guidelines & My Submissions */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Quality Checklist */}
            <div className="rounded-3xl border border-border/80 bg-white p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-bold font-headline text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Quality Guidelines
              </h3>
              <ul className="text-xs text-muted-foreground space-y-2.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Reproducibility:</strong> Prompt must generate consistent, high-quality results.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Dynamic Variables:</strong> Include clear customizable parameters like <code>[style]</code>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Originality:</strong> Only submit prompts and assets you created.</span>
                </li>
              </ul>
            </div>

            {/* My Submissions Track */}
            <div className="rounded-3xl border border-border/80 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h3 className="text-sm font-bold font-headline text-foreground">Your Listed Prompts</h3>
                <span className="text-xs text-muted-foreground font-semibold">
                  {mySubmissions.length} submitted
                </span>
              </div>

              {submissionsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 w-full animate-pulse bg-muted rounded-xl" />
                  ))}
                </div>
              ) : mySubmissions.length > 0 ? (
                <div className="space-y-3">
                  {mySubmissions.map((sub: any) => (
                    <div key={sub.id} className="p-3 rounded-2xl border border-border/60 bg-muted/20 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">{sub.name}</p>
                        <p className="text-[11px] font-extrabold text-foreground font-headline">₹{((sub.price || 0) / 100).toLocaleString('en-IN')}</p>
                      </div>
                      <Badge variant="outline" className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0",
                        sub.isPublished ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                      )}>
                        {sub.isPublished ? 'Live in Store' : 'Pending Review'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Layers className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">You haven&apos;t submitted any prompts yet.</p>
                </div>
              )}
            </div>

          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
