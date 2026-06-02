'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, limit, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, Loader2, Save, ImageIcon, Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import { uploadFileAction } from '@/app/actions/r2-actions';
import { generateSlug } from '@/lib/utils';
import { optimizeImage } from '@/lib/image-optimizer';
import Image from 'next/image';

export default function EditBlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  
  const postQuery = useMemoFirebase(() => {
    return db ? query(collection(db, 'blog_posts'), where('slug', '==', slug), limit(1)) : null;
  }, [db, slug]);

  const { data: posts, loading } = useCollection(postQuery);
  const post = posts?.[0] as any;

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

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        slug: post.slug || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        featuredImage: post.featuredImage || '',
        status: post.status || 'draft',
        tags: post.tags?.join(', ') || '',
        authorName: post.authorName || '',
        categoryId: post.categoryId || '',
      });
    }
  }, [post]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !formData.slug) return;

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
        toast({ title: "Cover Updated" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Failed" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !post) return;
    setIsSaving(true);

    try {
      await updateDoc(doc(db, 'blog_posts', post.id), {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Article Synchronized" });
      router.push('/admin/blog');
    } catch (error) {
      toast({ variant: "destructive", title: "Save Fault" });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  if (!post) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <AlertCircle className="h-10 w-10 text-destructive opacity-30" />
      <h2 className="text-xl font-bold">Article Missing</h2>
      <Button asChild><Link href="/admin/blog">Return to Editorial</Link></Button>
    </div>
  );

  return (
    <div className="space-y-8 pb-32">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/admin/blog"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-headline">Edit Article</h1>
          <p className="text-muted-foreground">Adjusting record for: {slug}</p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Card className="rounded-[2rem] border-white/5 bg-card/30 shadow-sm overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="grid gap-2">
                <Label>Headline</Label>
                <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required className="h-14 bg-background/50 rounded-2xl text-lg font-bold" />
              </div>
              <div className="grid gap-2">
                <Label>Dynamic Path</Label>
                <Input value={formData.slug} onChange={(e) => setFormData({...formData, slug: generateSlug(e.target.value)})} required className="h-12 bg-background/50 rounded-xl font-mono text-xs" />
              </div>
              <div className="grid gap-2">
                <Label>Editor Console</Label>
                <RichTextEditor content={formData.content} onChange={(content) => setFormData({...formData, content})} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="rounded-[2rem] border-white/5 bg-card/30 shadow-sm">
            <CardHeader><CardTitle className="text-lg font-headline">Article Data</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label>Author Name</Label>
                <Input value={formData.authorName} onChange={(e) => setFormData({...formData, authorName: e.target.value})} placeholder="Prontly Team" className="h-11 rounded-xl bg-background/50" />
              </div>
              <div className="grid gap-2">
                <Label>Classification</Label>
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
                <Label>Tags</Label>
                <Input value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} className="h-11 rounded-xl bg-background/50" />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                  <SelectTrigger className="h-11 rounded-xl bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-white/5 bg-card/30 shadow-sm overflow-hidden">
            <CardHeader><CardTitle className="text-lg font-headline">Cover Visual</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted border-white/5 flex items-center justify-center group shadow-inner">
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
                    <span className="text-[10px] font-bold uppercase text-muted-foreground">Upload Visual</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full h-16 text-xl font-bold rounded-2xl shadow-2xl shadow-primary/20" disabled={isSaving}>
            {isSaving ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Save className="h-6 w-6 mr-3" />}
            Sync Record
          </Button>
        </div>
      </form>
    </div>
  );
}
