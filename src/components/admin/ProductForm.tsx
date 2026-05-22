'use client';

import { useState } from 'react';
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
import { Loader2, Upload, Trash2, Image as ImageIcon, File as FileIcon, Sparkles, Search, Wand2, CheckCircle2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getUploadUrl } from '@/app/actions/r2-actions';
import { logAdminAction } from '@/lib/admin-logs';
import { generateProductCopy } from '@/ai/flows/generate-product-copy';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
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
    isPublished: initialData?.isPublished ?? false,
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

  const optimizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize if too large
          const MAX_WIDTH = 1920;
          if (width > MAX_WIDTH) {
            height = (MAX_WIDTH / width) * height;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas conversion failed'));
          }, 'image/webp', 0.85); // 85% quality WebP
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAiGenerate = async () => {
    if (!formData.name) {
      toast({ variant: "destructive", title: "Name Required", description: "Enter a product name to help AI generate content." });
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
      toast({ title: "AI Generation Complete", description: "Description and metadata have been updated." });
    } catch (error) {
      toast({ variant: "destructive", title: "AI Error", description: "Failed to generate product copy." });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formData.slug) {
      toast({ variant: "destructive", title: "Slug Required", description: "Please set a product name/slug before uploading assets." });
      return;
    }

    const fileId = Math.random().toString(36).substring(7);
    let fileName = "";
    let finalBlob: Blob | File = file;
    let finalType = file.type;

    try {
      if (type === 'image') {
        setUploadProgress(prev => ({ ...prev, [fileId]: 5 }));
        finalBlob = await optimizeImage(file);
        finalType = 'image/webp';
        const suffix = Math.random().toString(36).substring(2, 6);
        fileName = `product/${formData.slug}/gallery-${suffix}.webp`;
      } else {
        const ext = file.name.split('.').pop();
        fileName = `product/${formData.slug}/source-${Date.now()}.${ext}`;
      }
      
      setUploadProgress(prev => ({ ...prev, [fileId]: 10 }));
      const { url } = await getUploadUrl(fileName, finalType);
      
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url, true);
      xhr.setRequestHeader('Content-Type', finalType);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 90) + 10;
          setUploadProgress(prev => ({ ...prev, [fileId]: percent }));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://cdn.prontly.in'}/${fileName}`;
          if (type === 'image') {
            setFormData(prev => ({ ...prev, images: [...prev.images, publicUrl] }));
          } else {
            setFormData(prev => ({ 
              ...prev, 
              fileKey: publicUrl,
              fileSize: file.size,
              fileFormat: file.name.split('.').pop()?.toUpperCase() || ''
            }));
          }
          toast({ title: "Upload Success", description: `${file.name} is now available.` });
        } else {
          toast({ variant: "destructive", title: "Upload Failed", description: "Storage server rejected the request." });
        }
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      };

      xhr.onerror = () => {
        toast({ variant: "destructive", title: "Network Error", description: "Could not connect to storage provider." });
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      };
      
      xhr.send(finalBlob);
    } catch (error) {
      toast({ variant: "destructive", title: "Process Failed", description: "Could not optimize or prepare file." });
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
      const productData = {
        ...formData,
        price: Math.round(formData.price * 100),
        compareAtPrice: formData.compareAtPrice ? Math.round(formData.compareAtPrice * 100) : 0,
        categorySlug: selectedCategory?.slug || '',
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
          averageRating: 0,
          reviewCount: 0
        });
        await logAdminAction({
          db, adminId: user.uid, adminEmail: user.email!,
          action: 'CREATE', resourceType: 'PRODUCT', resourceId: docRef.id, details: { name: formData.name }
        });
      }

      toast({ title: "Success", description: id ? "Product updated." : "Product launched." });
      router.push('/admin/products');
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save product database record." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
      <div className="lg:col-span-2 space-y-8">
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="bg-muted/50 p-1 mb-6">
            <TabsTrigger value="content" className="gap-2"><ImageIcon className="h-4 w-4" /> Content & Media</TabsTrigger>
            <TabsTrigger value="seo" className="gap-2"><Search className="h-4 w-4" /> SEO Optimization</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Visual identity and primary descriptions.</CardDescription>
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
                  AI Assistant
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" value={formData.name} onChange={handleNameChange} required placeholder="e.g. Premium UI Design System" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input id="slug" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} required placeholder="premium-ui-design-system" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Input id="shortDescription" value={formData.shortDescription} onChange={(e) => setFormData({...formData, shortDescription: e.target.value})} placeholder="Punchy one-liner for listing pages" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Product Narrative</Label>
                  <RichTextEditor 
                    content={formData.description} 
                    onChange={(content) => setFormData({...formData, description: content})} 
                    placeholder="Go deep into features, benefits, and specifications..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assets & Media</CardTitle>
                <CardDescription>Gallery images and digital fulfillment files.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Product Gallery (4:5 or 16:9)</Label>
                    <Badge variant="outline" className="text-[10px]">Optimized to WebP automatically</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {formData.images.map((img, i) => (
                      <div key={i} className="relative aspect-[4/5] rounded-lg overflow-hidden border group bg-muted">
                        <Image src={img} alt="Preview" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            type="button" 
                            onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                            className="bg-destructive text-white p-2 rounded-full hover:scale-110 transition-transform"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        {i === 0 && <Badge className="absolute top-2 left-2 bg-primary shadow-lg">Thumbnail</Badge>}
                      </div>
                    ))}
                    <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg aspect-[4/5] cursor-pointer hover:bg-muted transition-colors border-white/5 bg-white/5">
                      <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                      <span className="text-[10px] text-muted-foreground font-medium text-center px-2">Upload Photo</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Source File (Secure ZIP/PDF)</Label>
                    {formData.fileKey && <Badge variant="outline" className="text-green-500 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" /> Payload Linked</Badge>}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                      <FileIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        value={formData.fileKey} 
                        readOnly 
                        placeholder="No asset linked yet" 
                        className="bg-muted pl-9 text-[10px] opacity-60 font-mono"
                      />
                    </div>
                    <Button type="button" variant="outline" className="relative overflow-hidden shrink-0 h-10">
                      <Upload className="h-4 w-4 mr-2" />
                      Browse Files
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'file')} />
                    </Button>
                  </div>
                </div>

                {Object.keys(uploadProgress).map(id => (
                  <div key={id} className="space-y-1 animate-in fade-in">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-primary">
                      <span>Syncing with Cloudflare R2...</span>
                      <span>{uploadProgress[id]}%</span>
                    </div>
                    <Progress value={uploadProgress[id]} className="h-1 bg-primary/20" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Search Optimization</CardTitle>
                <CardDescription>How search engines see this product.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="seoTitle">Meta Title</Label>
                  <Input 
                    id="seoTitle" 
                    value={formData.seo.title} 
                    onChange={(e) => setFormData({...formData, seo: {...formData.seo, title: e.target.value}})} 
                    placeholder="Focus Keyword | Brand Name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="seoDesc">Meta Description</Label>
                  <Textarea 
                    id="seoDesc" 
                    value={formData.seo.description} 
                    onChange={(e) => setFormData({...formData, seo: {...formData.seo, description: e.target.value}})} 
                    placeholder="Catchy snippet for Google results..."
                    className="resize-none h-24"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="seoKeywords">LSI Keywords</Label>
                  <Input 
                    id="seoKeywords" 
                    value={formData.seo.keywords} 
                    onChange={(e) => setFormData({...formData, seo: {...formData.seo, keywords: e.target.value}})} 
                    placeholder="ui kit, design system, figma template"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Categorization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Store Section</Label>
              <Select value={formData.categoryId} onValueChange={(val) => setFormData({...formData, categoryId: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tags">Discovery Tags</Label>
              <Input id="tags" value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} placeholder="design, react, toolkit" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Sales Price (INR)</Label>
              <Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comparePrice">List Price (Strikethrough)</Label>
              <Input id="comparePrice" type="number" step="0.01" value={formData.compareAtPrice} onChange={(e) => setFormData({...formData, compareAtPrice: Number(e.target.value)})} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="published" checked={formData.isPublished} onCheckedChange={(checked) => setFormData({...formData, isPublished: !!checked})} />
              <Label htmlFor="published" className="cursor-pointer">Public Visibility</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="featured" checked={formData.isFeatured} onCheckedChange={(checked) => setFormData({...formData, isFeatured: !!checked})} />
              <Label htmlFor="featured" className="cursor-pointer">Homepage Featured</Label>
            </div>
            <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
              {id ? 'Sync Updates' : 'Launch Asset'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
