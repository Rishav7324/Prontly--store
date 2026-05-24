'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, Loader2, Save, Upload, ImageIcon, Trash2, Sparkles, Wand2, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import { uploadFileAction } from '@/app/actions/r2-actions';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';
import { generateBlogDraft } from '@/ai/flows/blog-assistant-flow';
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
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    status: 'draft',
    tags: '',
  });

  const [aiInput, setAiInput] = useState({
    topic: '',
    tone: 'educational' as any
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

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

      toast({ title: "Draft Generated", description: "AI has populated the editor with a structured outline." });
      setIsAiModalOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: "AI Error", description: "Could not generate content." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formData.slug) {
      toast({ variant: "destructive", title: "Slug Required", description: "Please set a title before uploading an image." });
      return;
    }

    const fileName = `blog/${formData.slug}/featured.webp`;
    
    try {
      setUploadProgress(30);
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('key', fileName);

      const result = await uploadFileAction(uploadFormData);
      
      if (result.success) {
        setFormData(prev => ({ ...prev, featuredImage: result.url! }));
        toast({ title: "Upload Success" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Upload failed." });
    } finally {
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsSaving(true);

    try {
      await addDoc(collection(db, 'blog_posts'), {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        viewCount: 0,
        publishedAt: formData.status === 'published' ? serverTimestamp() : null
      });

      toast({ title: "Article Created" });
      router.push('/admin/blog');
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save article." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/admin/blog"><ChevronLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-headline">New Article</h1>
            <p className="text-muted-foreground">Draft your next story for the Prontly community.</p>
          </div>
        </div>

        <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" className="gap-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              <Sparkles className="h-4 w-4" />
              AI Assistant
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                Article Intelligence
              </DialogTitle>
              <DialogDescription>Enter a topic, and our AI will generate a comprehensive SEO-optimized draft for you.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>What is the article about?</Label>
                <Input 
                  placeholder="e.g. The Future of SaaS Design in 2025" 
                  value={aiInput.topic}
                  onChange={(e) => setAiInput({...aiInput, topic: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Writing Tone</Label>
                <Select value={aiInput.tone} onValueChange={(val) => setAiInput({...aiInput, tone: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="educational">Educational & Deep</SelectItem>
                    <SelectItem value="hype">High-Energy & Trendy</SelectItem>
                    <SelectItem value="professional">Corporate & Precise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              onClick={handleAiAssistant} 
              disabled={isGenerating || !aiInput.topic}
              className="w-full h-12 text-lg font-bold"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generate Draft
            </Button>
          </DialogContent>
        </Dialog>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-white/5 bg-card/30">
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Post Title</Label>
                <Input id="title" value={formData.title} onChange={handleTitleChange} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Post Slug</Label>
                <Input id="slug" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="excerpt">Short Summary (Excerpt)</Label>
                <Textarea 
                  id="excerpt" 
                  value={formData.excerpt} 
                  onChange={(e) => setFormData({...formData, excerpt: e.target.value})} 
                  placeholder="Appears in the blog listing cards..." 
                  className="resize-none h-24"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Article Content</Label>
                <RichTextEditor 
                  content={formData.content} 
                  onChange={(content) => setFormData({...formData, content})} 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-white/5 bg-card/30">
            <CardHeader>
              <CardTitle className="text-lg">Visual Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted border-2 border-dashed border-white/5 flex items-center justify-center group">
                {formData.featuredImage ? (
                  <>
                    <Image src={formData.featuredImage} alt="Featured" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="destructive" size="sm" onClick={() => setFormData({...formData, featuredImage: ''})}>
                        <Trash2 className="h-4 w-4 mr-2" /> Remove
                      </Button>
                    </div>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer p-4 w-full h-full">
                    <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground">Upload cover image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/5 bg-card/30">
            <CardHeader>
              <CardTitle className="text-lg">Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Publication Status</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags">Discovery Tags</Label>
                <Input id="tags" value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} placeholder="news, tutorials" />
              </div>
              <Button type="submit" className="w-full h-12 text-lg font-bold shadow-xl shadow-primary/20" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Save Article</>}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
