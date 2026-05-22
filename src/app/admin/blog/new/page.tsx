'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, Loader2, Save, Upload, ImageIcon, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import { uploadFileAction } from '@/app/actions/r2-actions';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';

export default function NewBlogPostPage() {
  const router = useRouter();
  const db = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    status: 'draft',
    tags: '',
  });

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }));
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

      setUploadProgress(60);
      const result = await uploadFileAction(uploadFormData);
      
      if (result.success) {
        setFormData(prev => ({ ...prev, featuredImage: result.url! }));
        toast({ title: "Upload Success", description: "Featured image uploaded." });
      } else {
        toast({ variant: "destructive", title: "Upload Failed", description: result.error });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not process image." });
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

      toast({ title: "Article Created", description: "Your blog post has been saved." });
      router.push('/admin/blog');
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create article." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/blog"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-headline">New Article</h1>
          <p className="text-muted-foreground">Draft your next story for the Prontly community.</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Post Title</Label>
                <Input 
                  id="title" 
                  value={formData.title} 
                  onChange={handleTitleChange} 
                  required 
                  placeholder="e.g. 10 Tips for Better AI Prompts" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input 
                  id="slug" 
                  value={formData.slug} 
                  onChange={(e) => setFormData({...formData, slug: e.target.value})} 
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea 
                  id="excerpt" 
                  value={formData.excerpt} 
                  onChange={(e) => setFormData({...formData, excerpt: e.target.value})} 
                  placeholder="Short summary for the blog listing page..." 
                  className="resize-none h-24"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Content</Label>
                <RichTextEditor 
                  content={formData.content} 
                  onChange={(content) => setFormData({...formData, content})} 
                  placeholder="Start writing your article..." 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-muted border-2 border-dashed border-white/5 flex items-center justify-center group">
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
              {uploadProgress > 0 && <Progress value={uploadProgress} className="h-1" />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Status</Label>
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
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input id="tags" value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} placeholder="news, tutorials" />
              </div>
              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Save Article</>}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
