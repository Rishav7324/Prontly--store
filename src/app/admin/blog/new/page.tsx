'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, Loader2, Save, Upload, ImageIcon, Trash2, Sparkles, Wand2, User } from 'lucide-react';
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

export default function NewBlogPostPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  
  const { data: categories } = useCollection(db ? collection(db, 'categories') : null);
  const { data: products } = useCollection(db ? collection(db, 'products') : null);

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
    relatedProductIds: [] as string[]
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
        content: `<h2>Executive Summary</h2><p>${res.introduction}</p><h3>Article Outline</h3><ul>${res.outline.map(o => `<li>${o}</li>`).join('')}</ul><hr />${res.contentDraft}`,
        tags: res.seoSuggestions.tags.join(', ')
      }));

      toast({ title: "Draft Synchronized" });
      setIsAiModalOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "AI Error" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formData.slug) {
      toast({ variant: "destructive", title: "Slug Required" });
      return;
    }

    try {
      setUploadProgress(30);
      const optimized = await optimizeImage(file);
      const optimizedFile = new File([optimized.blob], `${formData.slug}-cover.webp`, { type: 'image/webp' });
      
      const fileName = `blog/covers/${formData.slug}/${optimizedFile.name}`;
      const uploadFormData = new FormData();
      uploadFormData.append('file', optimizedFile);
      uploadFormData.append('key', fileName);

      setUploadProgress(60);
      const result = await uploadFileAction(uploadFormData);
      
      if (result.success) {
        setFormData(prev => ({ ...prev, featuredImage: result.url! }));
        toast({ title: "Cover Optimized & Uploaded" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Error" });
    } finally {
      setUploadProgress(0);
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
        authorName: formData.authorName || user.displayName || 'Prontly Team',
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        viewCount: 0,
        publishedAt: formData.status === 'published' ? serverTimestamp() : null
      });

      toast({ title: "Article Published" });
      router.push('/admin/blog');
    } catch (error) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-32">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/admin/blog"><ChevronLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-headline">Editorial Intelligence</h1>
            <p className="text-muted-foreground">URL Preview: store.prontly.in/blog/{formData.slug || '...'}</p>
          </div>
        </div>

        <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" className="gap-2 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="h-4 w-4" />
              AI Drafter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Content Generation</DialogTitle>
              <DialogDescription>AI will build a complete, SEO-optimized structure for your article.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Topic</Label>
                <Input placeholder="e.g. Scaling AI Workflows" value={aiInput.topic} onChange={(e) => setAiInput({...aiInput, topic: e.target.value})} />
              </div>
            </div>
            <Button onClick={handleAiAssistant} disabled={isGenerating || !aiInput.topic} className="w-full">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Sync AI Draft"}
            </Button>
          </DialogContent>
        </Dialog>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-white/5 bg-card/30 rounded-[2rem] overflow-hidden shadow-sm">
            <CardContent className="pt-8 space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="title">Article Headline</Label>
                <Input id="title" value={formData.title} onChange={handleTitleChange} required className="h-14 bg-background/50 rounded-2xl text-lg font-bold" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug ID</Label>
                <Input id="slug" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} required className="h-12 bg-background/50 rounded-xl font-mono text-xs" />
              </div>
              <div className="grid gap-2">
                <Label>Content Editor</Label>
                <RichTextEditor content={formData.content} onChange={(content) => setFormData({...formData, content})} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-white/5 bg-card/30 rounded-[2rem] shadow-sm">
            <CardHeader><CardTitle className="text-lg font-headline">Editorial Settings</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label>Author Display Name</Label>
                <Input value={formData.authorName} onChange={(e) => setFormData({...formData, authorName: e.target.value})} placeholder={user?.displayName || 'Prontly Team'} className="h-11 rounded-xl bg-background/50" />
              </div>
              <div className="grid gap-2">
                <Label>Primary Category</Label>
                <Select value={formData.categoryId} onValueChange={(val) => setFormData({...formData, categoryId: val})}>
                  <SelectTrigger className="h-11 rounded-xl bg-background/50">
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
                <Label>Tags (Comma separated)</Label>
                <Input value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} placeholder="ai, tutorial, marketplace" className="h-11 rounded-xl bg-background/50" />
              </div>
              <div className="grid gap-2">
                <Label>Publishing Status</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                  <SelectTrigger className="h-11 rounded-xl bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft (Private)</SelectItem>
                    <SelectItem value="published">Published (Public)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-card/30 rounded-[2rem] shadow-sm overflow-hidden">
            <CardHeader><CardTitle className="text-lg font-headline">Visual Assets</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted border-2 border-dashed border-white/5 flex items-center justify-center group shadow-inner">
                {formData.featuredImage ? (
                  <>
                    <Image src={formData.featuredImage} alt="Featured" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="destructive" size="sm" onClick={() => setFormData({...formData, featuredImage: ''})}>Remove</Button>
                    </div>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer p-4 w-full h-full">
                    <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                    <span className="text-xs font-bold uppercase text-muted-foreground">Upload WebP Cover</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full h-16 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20" disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Publish Article
          </Button>
        </div>
      </form>
    </div>
  );
}
