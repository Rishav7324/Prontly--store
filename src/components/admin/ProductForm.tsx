'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  Sparkles, 
  Search, 
  Wand2, 
  CheckCircle2,
  ExternalLink,
  Zap,
  Globe
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { uploadFileAction } from '@/app/actions/r2-actions';
import { logAdminAction } from '@/lib/admin-logs';
import { generateProductCopy } from '@/ai/flows/generate-product-copy';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import { generateSlug, formatBytes } from '@/lib/utils';
import { optimizeImage } from '@/lib/image-optimizer';
import Image from 'next/image';

interface ProductFormProps {
  initialData?: any;
  id?: string;
}

export function ProductForm({ initialData, id }: ProductFormProps) {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  
  const { data: categories } = useCollection(db ? collection(db, 'categories') : null);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    shortDescription: initialData?.shortDescription || '',
    categoryId: initialData?.categoryId || '',
    categorySlug: initialData?.categorySlug || '',
    price: initialData?.price ? initialData?.price / 100 : 0,
    compareAtPrice: initialData?.compareAtPrice ? initialData?.compareAtPrice / 100 : 0,
    images: initialData?.images || [],
    fileKey: initialData?.fileKey || '',
    isFeatured: initialData?.isFeatured ?? false,
    tags: initialData?.tags?.join(', ') || '',
    fileFormat: initialData?.fileFormat || '',
    fileSize: initialData?.fileSize || 0,
    fileVersion: initialData?.fileVersion || '1.0',
    seo: {
      title: initialData?.seo?.title || '',
      description: initialData?.seo?.description || '',
      keywords: initialData?.seo?.keywords || '',
    }
  });

  // Automated Slug Generation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleAiGenerate = async () => {
    if (!formData.name) {
      toast({ variant: "destructive", title: "Name Required" });
      return;
    }
    setIsGenerating(true);
    try {
      const selectedCategory = categories?.find(c => c.id === formData.categoryId);
      const result = await generateProductCopy({
        name: formData.name,
        category: selectedCategory?.name || 'Digital Asset',
        features: formData.shortDescription || formData.tags,
      });
      setFormData(prev => ({
        ...prev,
        description: result.description,
        shortDescription: result.shortDescription,
        seo: {
          ...prev.seo,
          keywords: result.seoKeywords.join(', '),
          description: result.shortDescription
        }
      }));
      toast({ title: "AI Copy Generated" });
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formData.slug) {
      toast({ variant: "destructive", title: "Slug Required", description: "Set a name to generate a slug first." });
      return;
    }

    const fileId = Math.random().toString(36).substring(7);
    try {
      setUploadProgress(prev => ({ ...prev, [fileId]: 10 }));
      
      let uploadFile = file;
      let finalKey = "";

      if (type === 'image') {
        setUploadProgress(prev => ({ ...prev, [fileId]: 30 }));
        const optimized = await optimizeImage(file);
        uploadFile = new File([optimized.blob], `${formData.slug}-${Date.now()}.webp`, { type: 'image/webp' });
        finalKey = `products/images/${formData.slug}/${uploadFile.name}`;
        
        toast({ 
          title: "Image Optimized", 
          description: `Compressed from ${formatBytes(optimized.originalSize)} to ${formatBytes(optimized.optimizedSize)}` 
        });
      } else {
        const ext = file.name.split('.').pop();
        finalKey = `products/files/${formData.slug}/${formData.slug}-source.${ext}`;
      }
      
      setUploadProgress(prev => ({ ...prev, [fileId]: 50 }));

      const uploadFormData = new FormData();
      uploadFormData.append('file', uploadFile);
      uploadFormData.append('key', finalKey);

      const result = await uploadFileAction(uploadFormData);

      if (result.success) {
        if (type === 'image') {
          setFormData(prev => ({ ...prev, images: [...prev.images, result.url!] }));
        } else {
          setFormData(prev => ({ 
            ...prev, 
            fileKey: result.url!,
            fileSize: uploadFile.size,
            fileFormat: uploadFile.name.split('.').pop()?.toUpperCase() || ''
          }));
        }
        toast({ title: "Upload Success" });
      } else {
        toast({ variant: "destructive", title: "Upload Failed", description: result.error });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Process Error" });
    } finally {
      setUploadProgress(prev => {
        const next = { ...prev };
        delete next[fileId];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;
    setIsSaving(true);

    try {
      const selectedCategory = categories?.find(c => c.id === formData.categoryId);
      const finalCategorySlug = selectedCategory?.slug || '';

      const productData = {
        ...formData,
        price: Math.round(formData.price * 100),
        categorySlug: finalCategorySlug,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        updatedAt: serverTimestamp(),
        bannerImage: formData.images[0] || '',
      };

      if (id) {
        await setDoc(doc(db, 'products', id), productData, { merge: true });
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: serverTimestamp(),
          salesCount: 0,
          downloadCount: 0,
          averageRating: 5.0,
          reviewCount: 0
        });
      }

      toast({ title: "Product Synchronized" });
      router.push('/admin/products');
    } catch (error) {
      toast({ variant: "destructive", title: "Save Error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
      <div className="lg:col-span-2 space-y-8">
        <Card className="border-white/5 bg-card/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Catalog Automation</CardTitle>
              <CardDescription>Visual URL: store.prontly.in/products/{formData.slug || '...'}</CardDescription>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="gap-2 text-primary border-primary/20 hover:bg-primary/5"
              onClick={handleAiGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              AI Content
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Product Title</Label>
              <Input id="name" value={formData.name} onChange={handleNameChange} required placeholder="e.g. Master AI Prompt Pack" className="h-12 bg-background/50 rounded-xl" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug" className="flex items-center gap-2">
                URL Identifier
                <Badge variant="outline" className="text-[8px] uppercase tracking-tighter py-0">Auto-Generated</Badge>
              </Label>
              <Input id="slug" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} required className="h-12 bg-background/50 rounded-xl font-mono text-xs" />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <RichTextEditor 
                content={formData.description} 
                onChange={(content) => setFormData({...formData, description: content})} 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-card/30">
          <CardHeader>
            <CardTitle>Media & SEO Automation</CardTitle>
            <CardDescription>Images are automatically converted to WebP and optimized for high-performance delivery.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {formData.images.map((img, i) => (
                <div key={i} className="relative aspect-[4/5] rounded-xl overflow-hidden border border-white/5 group bg-muted">
                  <Image src={img} alt="Preview" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))} className="bg-destructive text-white p-2 rounded-full">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl aspect-[4/5] cursor-pointer hover:bg-white/5 border-white/10 bg-white/5 transition-colors">
                <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Upload Image</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
              </label>
            </div>

            <div className="space-y-4 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between">
                <Label>Dynamic OG Preview</Label>
                <Badge className="bg-green-500/10 text-green-500 border-none">Ready</Badge>
              </div>
              <div className="aspect-[1200/630] w-full rounded-2xl bg-black border border-white/5 overflow-hidden relative shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(85,78,210,0.2),transparent)]" />
                <div className="absolute inset-0 flex flex-col p-8 justify-between">
                   <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center"><Zap className="h-4 w-4 text-white" /></div>
                    <span className="font-bold text-white text-xs tracking-tight">PRONTLY STORE</span>
                  </div>
                  <div className="space-y-2">
                    <div className="px-2 py-1 bg-primary/20 text-primary text-[8px] font-bold uppercase tracking-widest self-start rounded w-fit">{formData.categorySlug || 'Category'}</div>
                    <div className="text-2xl font-bold text-white leading-tight max-w-sm">{formData.name || 'Your Product Title'}</div>
                    <div className="text-primary font-bold text-lg">₹{formData.price || '0'}</div>
                  </div>
                  <div className="text-[8px] text-muted-foreground">store.prontly.in/products/{formData.slug || '...'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <Card className="border-white/5 bg-card/30">
          <CardHeader><CardTitle>Launch Configuration</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Market Category</Label>
              <Select value={formData.categoryId} onValueChange={(val) => setFormData({...formData, categoryId: val})}>
                <SelectTrigger className="h-12 bg-background/50 rounded-xl"><SelectValue placeholder="Choose Category" /></SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Sale Price (INR)</Label>
              <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} className="h-12 bg-background/50 rounded-xl" />
            </div>
            <div className="grid gap-2 pt-4">
              <Label>Source Asset (Secure)</Label>
              <div className="flex gap-2">
                <Input value={formData.fileKey ? 'Linked' : 'Missing'} readOnly className="h-12 bg-muted/30 border-dashed rounded-xl font-mono text-xs opacity-50" />
                <Button type="button" variant="outline" className="h-12 relative px-6 rounded-xl border-white/10">
                  <Upload className="h-4 w-4 mr-2" />
                  Link File
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'file')} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-16 text-xl font-bold rounded-2xl shadow-2xl shadow-primary/30" disabled={isSaving}>
          {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <CheckCircle2 className="h-6 w-6 mr-3" />}
          {id ? 'Update Asset' : 'Deploy Product'}
        </Button>
      </div>
    </form>
  );
}
