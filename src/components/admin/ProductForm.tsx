'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { doc, setDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  Sparkles, 
  CheckCircle2,
  Zap,
  Globe,
  Lock,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { uploadFileAction } from '@/app/actions/r2-actions';
import { logAdminAction } from '@/lib/admin-logs';
import { generateProductCopy } from '@/ai/flows/generate-product-copy';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import { generateSlug, formatBytes } from '@/lib/utils';
import { optimizeImage } from '@/lib/image-optimizer';
import Image from 'next/image';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

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
  const [isSlugLocked, setIsSlugLocked] = useState(!!id);
  
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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: isSlugLocked ? prev.slug : generateSlug(name)
    }));
  };

  const regenerateSlug = () => {
    setFormData(prev => ({ ...prev, slug: generateSlug(prev.name) }));
    toast({ title: "Slug Regenerated" });
  };

  const handleAiGenerate = async () => {
    if (!formData.name) return;
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
      toast({ title: "AI Copy Ready" });
    } catch (error) {
      toast({ variant: "destructive", title: "AI Generation Offline" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file || !formData.name) {
      toast({ variant: "destructive", title: "Missing Name", description: "Set a product name before uploading media." });
      return;
    }

    const tempSlug = formData.slug || generateSlug(formData.name);
    const fileId = Math.random().toString(36).substring(7);
    
    try {
      setUploadProgress(prev => ({ ...prev, [fileId]: 10 }));
      let uploadFile = file;
      let finalKey = "";

      if (type === 'image') {
        const optimized = await optimizeImage(file);
        uploadFile = new File([optimized.blob], `${tempSlug}-${Date.now()}.webp`, { type: 'image/webp' });
        finalKey = `products/images/${tempSlug}/${uploadFile.name}`;
      } else {
        const ext = file.name.split('.').pop();
        finalKey = `products/files/${tempSlug}/${tempSlug}-source.${ext}`;
      }
      
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
        toast({ title: "Resource Linked" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload Fault" });
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

    // 1. Final slug validation (Unique check)
    const slugToSave = formData.slug || generateSlug(formData.name);
    const slugQuery = query(collection(db, 'products'), where('slug', '==', slugToSave));
    const slugSnap = await getDocs(slugQuery);
    
    let finalSlug = slugToSave;
    if (!id && !slugSnap.empty) {
      finalSlug = `${slugToSave}-${Math.floor(Math.random() * 1000)}`;
      toast({ title: "Slug Collision", description: `Assigned unique suffix: ${finalSlug}` });
    }

    const selectedCategory = categories?.find(c => c.id === formData.categoryId);
    const productData = {
      ...formData,
      slug: finalSlug,
      price: Math.round(formData.price * 100),
      compareAtPrice: Math.round(formData.compareAtPrice * 100),
      categorySlug: selectedCategory?.slug || '',
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      updatedAt: serverTimestamp(),
      bannerImage: formData.images[0] || '',
    };

    const docRef = id ? doc(db, 'products', id) : doc(collection(db, 'products'));
    const operation = id ? 'update' : 'create';

    const finalPayload = id ? productData : {
      ...productData,
      createdAt: serverTimestamp(),
      salesCount: 0,
      downloadCount: 0,
      averageRating: 5.0,
      reviewCount: 0
    };

    setDoc(docRef, finalPayload, { merge: true })
      .then(() => {
        logAdminAction({
          db, adminId: user.uid, adminEmail: user.email!,
          action: id ? 'UPDATE' : 'CREATE', resourceType: 'PRODUCT', resourceId: docRef.id, details: { name: formData.name, slug: finalSlug }
        });
        toast({ title: "Product Synchronized" });
        router.push('/admin/products');
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: operation as any,
          requestResourceData: finalPayload,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSaving(false));
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
      <div className="lg:col-span-2 space-y-8">
        <Card className="border-white/5 bg-card/30">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Catalog Specification</CardTitle>
              <CardDescription>Structure your digital inventory for maximum SEO visibility.</CardDescription>
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
              Generate Copy
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Asset Title</Label>
              <Input id="name" value={formData.name} onChange={handleNameChange} required className="h-12 bg-background/50 rounded-xl" placeholder="e.g. ChatGPT Prompt Bundle" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug" className="flex items-center justify-between">
                <span>URL Slug (SEO Identifier)</span>
                <button type="button" onClick={() => setIsSlugLocked(!isSlugLocked)} className="text-[10px] uppercase font-bold text-primary flex items-center gap-1">
                  {isSlugLocked ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                  {isSlugLocked ? 'Unlock for edit' : 'Lock Slug'}
                </button>
              </Label>
              <div className="relative">
                <Input 
                  id="slug" 
                  value={formData.slug} 
                  onChange={(e) => setFormData({...formData, slug: generateSlug(e.target.value)})} 
                  readOnly={isSlugLocked}
                  className="h-12 bg-background/50 rounded-xl font-mono text-xs pr-10" 
                  placeholder="chatgpt-prompt-bundle"
                />
                {!isSlugLocked && (
                  <button type="button" onClick={regenerateSlug} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                    <RefreshCw className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground pl-1">
                Preview: <span className="text-primary font-bold">store.prontly.in/products/{formData.slug || '...'}</span>
              </p>
            </div>

            <div className="grid gap-2">
              <Label>Editorial Description</Label>
              <RichTextEditor 
                content={formData.description} 
                onChange={(content) => setFormData({...formData, description: content})} 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-card/30">
          <CardHeader>
            <CardTitle>Media Gallery</CardTitle>
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
                <span className="text-[10px] font-bold uppercase text-muted-foreground">Upload Visual</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
              </label>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <Card className="border-white/5 bg-card/30">
          <CardHeader><CardTitle>Economic Parameters</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={formData.categoryId} onValueChange={(val) => setFormData({...formData, categoryId: val})}>
                <SelectTrigger className="h-12 bg-background/50 rounded-xl"><SelectValue placeholder="Select Index" /></SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>List Price (INR)</Label>
              <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} className="h-12 bg-background/50 rounded-xl" />
            </div>
            <div className="grid gap-2 pt-4">
              <Label>Source File (Secure Storage)</Label>
              <div className="flex gap-2">
                <Input value={formData.fileKey ? 'Linked' : 'Pending'} readOnly className="h-12 bg-muted/30 border-dashed rounded-xl font-mono text-xs opacity-50" />
                <Button type="button" variant="outline" className="h-12 relative px-6 rounded-xl border-white/10">
                  <Upload className="h-4 w-4 mr-2" />
                  Attach
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'file')} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-16 text-xl font-bold rounded-2xl shadow-2xl shadow-primary/30" disabled={isSaving}>
          {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <CheckCircle2 className="h-6 w-6 mr-3" />}
          {id ? 'Synchronize Updates' : 'Deploy Infrastructure'}
        </Button>
      </div>
    </form>
  );
}
