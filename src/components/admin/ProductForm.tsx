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
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  File as FileIcon, 
  Sparkles, 
  Search, 
  Wand2, 
  CheckCircle2,
  Camera
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { uploadFileAction } from '@/app/actions/r2-actions';
import { logAdminAction } from '@/lib/admin-logs';
import { generateProductCopy } from '@/ai/flows/generate-product-copy';
import { generateProductImage } from '@/ai/flows/generate-product-image';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";

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
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isAiImageModalOpen, setIsAiImageModalOpen] = useState(false);
  const [aiImagePrompt, setAiImagePrompt] = useState('');

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

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        slug: initialData.slug || '',
        description: initialData.description || '',
        shortDescription: initialData.shortDescription || '',
        categoryId: initialData.categoryId || '',
        categorySlug: initialData.categorySlug || '',
        price: initialData.price ? initialData.price / 100 : 0,
        compareAtPrice: initialData.compareAtPrice ? initialData.compareAtPrice / 100 : 0,
        images: initialData.images || [],
        fileKey: initialData.fileKey || '',
        isFeatured: initialData.isFeatured ?? false,
        tags: initialData.tags?.join(', ') || '',
        fileFormat: initialData.fileFormat || '',
        fileSize: initialData.fileSize || 0,
        fileVersion: initialData.fileVersion || '1.0',
        seo: {
          title: initialData.seo?.title || '',
          description: initialData.seo?.description || '',
          keywords: initialData.seo?.keywords || '',
        }
      });
    }
  }, [initialData]);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name)
    }));
  };

  const handleAiGenerate = async () => {
    if (!formData.name) {
      toast({ variant: "destructive", title: "Name Required", description: "Enter a product name first." });
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
      toast({ title: "AI Generation Complete" });
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAiImage = async () => {
    if (!aiImagePrompt || !formData.slug) return;
    setIsGeneratingImage(true);
    try {
      const { imageUrl } = await generateProductImage({ prompt: aiImagePrompt });
      
      // Convert data URI to File object for R2 upload
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const suffix = Math.random().toString(36).substring(2, 6);
      const fileName = `product/${formData.slug}/ai-gen-${suffix}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('key', fileName);

      const result = await uploadFileAction(uploadFormData);

      if (result.success) {
        setFormData(prev => ({ ...prev, images: [...prev.images, result.url!] }));
        toast({ title: "AI Image Generated", description: "Visual has been added to your gallery." });
        setIsAiImageModalOpen(false);
        setAiImagePrompt('');
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "AI Image Failed", description: error.message });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formData.slug) {
      toast({ variant: "destructive", title: "Slug Required" });
      return;
    }

    const fileId = Math.random().toString(36).substring(7);
    let fileName = "";

    try {
      setUploadProgress(prev => ({ ...prev, [fileId]: 20 }));

      if (type === 'image') {
        const suffix = Math.random().toString(36).substring(2, 6);
        fileName = `product/${formData.slug}/gallery-${suffix}.${file.name.split('.').pop()}`;
      } else {
        const ext = file.name.split('.').pop();
        fileName = `product/${formData.slug}/source-${Date.now()}.${ext}`;
      }
      
      setUploadProgress(prev => ({ ...prev, [fileId]: 50 }));

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('key', fileName);

      const result = await uploadFileAction(uploadFormData);

      if (result.success) {
        if (type === 'image') {
          setFormData(prev => ({ ...prev, images: [...prev.images, result.url!] }));
        } else {
          setFormData(prev => ({ 
            ...prev, 
            fileKey: result.url!,
            fileSize: file.size,
            fileFormat: file.name.split('.').pop()?.toUpperCase() || ''
          }));
        }
        toast({ title: "File Synced" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Failed" });
    } finally {
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;
    setIsSaving(true);

    try {
      const selectedCategory = categories?.find(c => c.id === formData.categoryId);
      const finalCategorySlug = selectedCategory?.slug || initialData?.categorySlug || '';

      const productData = {
        ...formData,
        price: Math.round(formData.price * 100),
        compareAtPrice: formData.compareAtPrice ? Math.round(formData.compareAtPrice * 100) : 0,
        categorySlug: finalCategorySlug,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        updatedAt: serverTimestamp(),
        bannerImage: formData.images[0] || '',
      };

      if (id) {
        await setDoc(doc(db, 'products', id), productData, { merge: true });
        await logAdminAction({
          db, adminId: user.uid, adminEmail: user.email!,
          action: 'UPDATE', resourceType: 'PRODUCT', resourceId: id, details: { name: formData.name }
        });
      } else {
        const docRef = await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: serverTimestamp(),
          salesCount: 0,
          downloadCount: 0,
          averageRating: 5.0,
          reviewCount: 0
        });
        await logAdminAction({
          db, adminId: user.uid, adminEmail: user.email!,
          action: 'CREATE', resourceType: 'PRODUCT', resourceId: docRef.id, details: { name: formData.name }
        });
      }

      toast({ title: "Product Saved" });
      router.push('/admin/products');
    } catch (error) {
      toast({ variant: "destructive", title: "Error Saving Product" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
      <div className="lg:col-span-2 space-y-8">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="bg-muted/50 p-1 mb-6">
            <TabsTrigger value="content" className="gap-2"><ImageIcon className="h-4 w-4" /> Content</TabsTrigger>
            <TabsTrigger value="seo" className="gap-2"><Search className="h-4 w-4" /> SEO</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Basic Details</CardTitle>
                  <CardDescription>Product identity and story.</CardDescription>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 text-primary border-primary/20 hover:bg-primary/5"
                  onClick={handleAiGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  AI Copy
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={formData.name} onChange={handleNameChange} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shortDescription">Short Summary</Label>
                  <Input id="shortDescription" value={formData.shortDescription} onChange={(e) => setFormData({...formData, shortDescription: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>Detailed Description</Label>
                  <RichTextEditor 
                    content={formData.description} 
                    onChange={(content) => setFormData({...formData, description: content})} 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gallery & Fulfillment</CardTitle>
                  <CardDescription>Visuals and the actual asset file.</CardDescription>
                </div>
                
                <Dialog open={isAiImageModalOpen} onOpenChange={setIsAiImageModalOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="sm" 
                      className="gap-2 bg-primary/10 text-primary border-primary/20"
                      disabled={!formData.slug}
                    >
                      <Camera className="h-4 w-4" />
                      AI Designer
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>AI Product Visualization</DialogTitle>
                      <DialogDescription>Describe the product visual you want to generate. We'll optimize it for high-end photography.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <div className="grid gap-2">
                        <Label>Visual Description</Label>
                        <Textarea 
                          placeholder="e.g. A sleek dark-themed SaaS dashboard on a premium laptop screen with soft purple neon lighting"
                          value={aiImagePrompt}
                          onChange={(e) => setAiImagePrompt(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleGenerateAiImage} disabled={isGeneratingImage || !aiImagePrompt} className="w-full">
                        {isGeneratingImage ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                        Generate & Upload
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {formData.images.map((img, i) => (
                    <div key={i} className="relative aspect-[4/5] rounded-lg overflow-hidden border group bg-muted">
                      <Image src={img} alt="Preview" fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          type="button" 
                          onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                          className="bg-destructive text-white p-2 rounded-full"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg aspect-[4/5] cursor-pointer hover:bg-muted border-white/5 bg-white/5">
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-[10px] text-muted-foreground">Upload Image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
                  </label>
                </div>

                <div className="space-y-2">
                  <Label>Source File (Secure Storage)</Label>
                  <div className="flex items-center gap-4">
                    <Input value={formData.fileKey} readOnly placeholder="No file linked" className="bg-muted font-mono text-xs" />
                    <Button type="button" variant="outline" className="relative shrink-0">
                      <Upload className="h-4 w-4 mr-2" />
                      Browse
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'file')} />
                    </Button>
                  </div>
                </div>

                {Object.keys(uploadProgress).map(id => (
                  <div key={id} className="space-y-1">
                    <div className="flex justify-between text-[10px] uppercase font-bold text-primary">
                      <span>Uploading...</span>
                      <span>{uploadProgress[id]}%</span>
                    </div>
                    <Progress value={uploadProgress[id]} className="h-1" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>SEO Optimization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="seoTitle">Meta Title</Label>
                  <Input id="seoTitle" value={formData.seo.title} onChange={(e) => setFormData({...formData, seo: {...formData.seo, title: e.target.value}})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="seoDesc">Meta Description</Label>
                  <Textarea id="seoDesc" value={formData.seo.description} onChange={(e) => setFormData({...formData, seo: {...formData.seo, description: e.target.value}})} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader><CardTitle>Pricing & Section</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Store Category</Label>
              <Select value={formData.categoryId} onValueChange={(val) => setFormData({...formData, categoryId: val})}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Price (INR)</Label>
              <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isSaving}>
          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
          {id ? 'Update Product' : 'Launch Product'}
        </Button>
      </div>
    </form>
  );
}
