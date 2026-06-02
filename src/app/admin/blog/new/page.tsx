'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, Loader2, Save, ImageIcon, Sparkles, Wand2, ArrowUpRight, Globe, Lock, Eye, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import { uploadFileAction } from '@/app/actions/r2-actions';
import { generateBlogDraft } from '@/ai/flows/blog-assistant-flow';
import { generateSlug } from '@/lib/utils';
import { optimizeImage } from '@/lib/image-optimizer';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function NewBlogPostPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  
  const { data: categories } = useCollection(db ? collection(db, 'categories') : null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    status: 'draft',
    tags: '',
    authorName: '',
    categoryId: '',
  });

  const [aiInput, setAiInput] = useState({
    topic: '',
    tone: 'educational' as any
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  const handleAiAssistant = async () => {
    if (!aiInput.topic) return;
    setIsGenerating(true);
    try {
      const res = await generateBlogDraft({
        topic: aiInput.topic,
        tone: aiInput.tone
      });

      setFormData(prev => ({
        ...prev,
        title: aiInput.topic,
        slug: generateSlug(aiInput.topic),
        excerpt: res.introduction,
        content: `<h2>Summary</h2><p>${res.introduction}</p><h3>Key Takeaways</h3><ul>${res.outline.map(o => `<li>${o}</li>`).join('')}</ul><hr />${res.contentDraft}`,
        tags: res.seoSuggestions.tags.join(', ')
      }));

      toast({ title: "AI Forge Synchronized", description: "Draft generated successfully." });
      setIsAiModalOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Forge Error", description: "AI generation failed." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !formData.slug) {
      toast({ variant: "destructive", title: "Slug Required", description: "Define a slug before uploading visuals." });
      return;
    }

    try {
      const optimized = await optimizeImage(file);
      const optimizedFile = new File([optimized.blob], `${formData.slug}-cover.webp`, { type: 'image/webp' });
      
      const fileName = `blog/covers/${formData.slug}/${optimizedFile.name}`;
      const uploadFormData = new FormData();
      uploadFormData.append('file', optimizedFile);
      uploadFormData.append('key', fileName);

      const result = await uploadFileAction(uploadFormData);
      if (result.success) {
        setFormData(prev => ({ ...prev, featuredImage: result.url! }));
        toast({ title: "Visual Integrated" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Fault" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;
    setIsSaving(true);

    try {
      await addDoc(collection(db, 'blog_posts'), {
        ...formData,
        authorId: user.uid,
        authorName: formData.authorName || user.displayName || 'Prontly Editorial',
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        viewCount: 0,
        publishedAt: formData.status === 'published' ? serverTimestamp() : null
      });

      toast({ title: "Article Published", description: "Marketplace intelligence synchronized." });
      router.push('/admin/blog');
    } catch (error) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-10 pb-40">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-8">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" asChild className="rounded-full bg-muted/30 h-12 w-12 border border-white/5">
            <Link href="/admin/blog"><ChevronLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.25em] text-primary mb-1">
               <Globe className="h-3 w-3" /> Editorial Intelligence
            </div>
            <h1 className="text-3xl font-bold font-headline text-midnight-ink">New Article Forge</h1>
            <p className="text-xs text-muted-foreground mt-1 font-mono">store.prontly.in/blog/{formData.slug || '...'}</p>
          </div>
        </div>

        <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" className="gap-2.5 h-12 px-6 rounded-xl bg-primary/5 text-primary border-primary/10 font-bold hover:bg-primary/10 transition-all">
              <Sparkles className="h-4 w-4" />
              AI Draft Assistant
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2rem] border-stone-gray/10 p-10 bg-white">
            <DialogHeader className="space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10">
                <Wand2 className="h-7 w-7 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-headline font-bold">Forge New Draft</DialogTitle>
                <DialogDescription className="text-base text-slate-blue">Our models will engineer a high-performing article structure based on your topic.</DialogDescription>
              </div>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div className="grid gap-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-ghost-gray ml-1">Article Topic</Label>
                <Input placeholder="e.g. Master your AI Workflow with 5 Expert Tips" value={aiInput.topic} onChange={(e) => setAiInput({...aiInput, topic: e.target.value})} className="h-14 bg-muted/30 rounded-2xl px-6 text-lg border-transparent focus:ring-1 focus:ring-primary" />
              </div>
              <div className="grid gap-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-ghost-gray ml-1">Brand Voice</Label>
                <Select value={aiInput.tone} onValueChange={(v) => setAiInput({...aiInput, tone: v})}>
                  <SelectTrigger className="h-14 bg-muted/30 rounded-2xl px-6 border-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="educational">Educational & Technical</SelectItem>
                    <SelectItem value="hype">High-Energy & Viral</SelectItem>
                    <SelectItem value="professional">Enterprise Authoritative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleAiAssistant} disabled={isGenerating || !aiInput.topic} className="w-full h-16 rounded-2xl text-lg font-bold shadow-2xl shadow-primary/20 transition-all group">
              {isGenerating ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Sparkles className="h-6 w-6 mr-3 transition-transform group-hover:rotate-12" />}
              Launch AI Forge
            </Button>
          </DialogContent>
        </Dialog>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          <Card className="border-stone-gray/10 bg-white rounded-[2.5rem] overflow-hidden shadow-sm">
            <CardHeader className="p-4 sm:p-10 border-b border-stone-gray/5 bg-muted/20">
              <CardTitle className="text-xl font-headline">Editorial Content</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-10 space-y-8">
              <div className="grid gap-3">
                <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-ghost-gray ml-1">Headline</Label>
                <Input id="title" value={formData.title} onChange={handleTitleChange} required className="h-16 bg-background rounded-2xl text-2xl font-bold border-stone-gray/10 px-6" placeholder="Article title..." />
              </div>
              
              <div className="grid gap-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-ghost-gray ml-1">Editorial Node</Label>
                <RichTextEditor content={formData.content} onChange={(content) => setFormData({...formData, content})} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="border-stone-gray/10 bg-white rounded-[2.5rem] shadow-sm">
            <CardHeader className="p-8 border-b border-stone-gray/5 bg-muted/20"><CardTitle className="text-lg font-headline">Article Meta</CardTitle></CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Classification</Label>
                <Select value={formData.categoryId} onValueChange={(val) => setFormData({...formData, categoryId: val})}>
                  <SelectTrigger className="h-12 rounded-xl bg-background border-stone-gray/10">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Metadata Tags</Label>
                <Input value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} placeholder="ai, workflow, creator..." className="h-12 rounded-xl border-stone-gray/10" />
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Author Override</Label>
                <Input value={formData.authorName} onChange={(e) => setFormData({...formData, authorName: e.target.value})} placeholder={user?.displayName || 'Prontly Editorial'} className="h-12 rounded-xl border-stone-gray/10" />
              </div>

              <div className="pt-4 border-t border-stone-gray/5">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-stone-gray/5">
                   <div className="space-y-0.5">
                      <p className="text-xs font-bold text-midnight-ink">Market Visibility</p>
                      <p className="text-[9px] text-slate-blue font-black uppercase tracking-widest">Public Publication</p>
                   </div>
                   <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                      <SelectTrigger className="w-28 h-9 rounded-lg bg-white border-stone-gray/20 text-[10px] font-black uppercase">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Live</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-stone-gray/10 bg-white rounded-[2.5rem] shadow-sm overflow-hidden">
            <CardHeader className="p-8 border-b border-stone-gray/5 bg-muted/20"><CardTitle className="text-lg font-headline">Cover Visual</CardTitle></CardHeader>
            <CardContent className="p-8">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted border-2 border-dashed border-stone-gray/10 flex items-center justify-center group shadow-inner">
                {formData.featuredImage ? (
                  <>
                    <Image src={formData.featuredImage} alt="Featured" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button type="button" variant="destructive" size="sm" className="rounded-lg font-bold text-[10px] uppercase" onClick={() => setFormData({...formData, featuredImage: ''})}>Remove Asset</Button>
                    </div>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer p-10 w-full h-full hover:bg-white/50 transition-colors text-center">
                    <ImageIcon className="h-10 w-10 text-ghost-gray mb-3 opacity-40" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synchronize WebP Visual</p>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
             <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-bold shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 group" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Save className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />}
                Synchronize Article
             </Button>
             <div className="flex items-center justify-center gap-2 py-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-[9px] font-black uppercase text-ghost-gray tracking-[0.2em]">SSL Encrypted Publishing</span>
             </div>
          </div>
        </div>
      </form>
    </div>
  );
}