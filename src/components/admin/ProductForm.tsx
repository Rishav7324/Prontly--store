'use client';

import { useState, useEffect, Key } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
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
  Lock,
  Globe,
  Zap
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { uploadFileAction } from '@/app/actions/r2-actions';
import { logAdminAction } from '@/lib/admin-logs';
import { generateProductCopy } from '@/ai/flows/generate-product-copy';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import { cn, generateSlug } from '@/lib/utils';
import { optimizeImage } from '@/lib/image-optimizer';
import Image from 'next/image';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { StaticImport } from 'next/dist/shared/lib/get-img-props';

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
    fileFormat: initialData?.fileFormat || 'SOURCE',
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
        fileFormat: initialData.fileFormat || 'SOURCE',
        fileVersion: initialData.fileVersion || '1.0',
        seo: {
          title: initialData.seo?.title || '',
          description: initialData.seo?.description || '',
          keywords: initialData.seo?.keywords || '',
        }
      });
      setIsSlugLocked(true);
    }
  }, [initialData]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: isSlugLocked ? prev.slug : generateSlug(name)
    }));
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
        tone: 'professional'
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
      toast({ variant: "destructive", title: "AI Generation Error" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file || !formData.name) return;

    const tempSlug = formData.slug || generateSlug(formData.name);
    
    try {
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
            fileFormat: uploadFile.name.split('.').pop()?.toUpperCase() || 'ZIP'
          }));
        }
        toast({ title: "Upload Success" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Error" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;
    setIsSaving(true);

    const slugToSave = formData.slug || generateSlug(formData.name);
    const selectedCategory = categories?.find(c => c.id === formData.categoryId);
    
    const productData = {
      ...formData,
      slug: slugToSave,
      price: Math.round(formData.price * 100),
      compareAtPrice: Math.round(formData.compareAtPrice * 100),
      categorySlug: selectedCategory?.slug || '',
      tags: formData.tags.split(',').map((t: string) => t.trim()).filter((t: any) => t),
      updatedAt: serverTimestamp(),
      ...(id ? {} : { createdAt: serverTimestamp() }), // CRITICAL: Save createdAt for new products
      bannerImage: formData.images[0] || '',
    };

    const docRef = id ? doc(db, 'products', id) : doc(collection(db, 'products'));

    setDoc(docRef, productData, { merge: true })
      .then(() => {
        logAdminAction({
          db, adminId: user.uid, adminEmail: user.email!,
          action: id ? 'UPDATE' : 'CREATE', resourceType: 'PRODUCT', resourceId: docRef.id, details: { name: formData.name, slug: slugToSave }
        });
        toast({ title: `Product ${id ? 'Updated' : 'Created'}` });
        router.push('/admin/products');
      })
      .catch(async () => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: id ? 'update' : 'create',
          requestResourceData: productData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setIsSaving(false));
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-32">
      <div className="lg:col-span-2 space-y-8">
        <Card className="border-white/5 bg-card/30 rounded-[2rem]">
          <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-white/5">
            <div>
              <CardTitle className="text-2xl font-headline">Product Core</CardTitle>
              <CardDescription>Configure primary attributes and technical documentation.</CardDescription>
            </div>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="gap-2 text-primary border-primary/20 rounded-xl h-10"
              onClick={handleAiGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              AI Copy
            </Button>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid gap-3">
              <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Asset Headline</Label>
              <Input value={formData.name} onChange={handleNameChange} required className="h-14 bg-background/50 rounded-2xl text-lg font-bold" placeholder="e.g. AI Workflow Pack" />
            </div>

            <div className="grid gap-3">
              <Label className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">
                <span>URL Path (Slug)</span>
                <button type="button" onClick={() => setIsSlugLocked(!isSlugLocked)} className="text-[9px] font-black text-primary flex items-center gap-1 uppercase hover:opacity-70 transition-opacity">
                  {isSlugLocked ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                  {isSlugLocked ? 'Edit Slug' : 'Lock Slug'}
                </button>
              </Label>
              <div className="relative group">
                <Input 
                  value={formData.slug} 
                  onChange={(e) => setFormData({...formData, slug: generateSlug(e.target.value)})} 
                  readOnly={isSlugLocked}
                  className={cn(
                    "h-14 bg-background/50 rounded-2xl font-mono text-sm pl-14 transition-all",
                    isSlugLocked ? "opacity-60 grayscale cursor-not-allowed" : "border-primary/30"
                  )}
                />
                <div className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">/</div>
              </div>
            </div>

            <div className="grid gap-3">
              <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Documentation</Label>
              <RichTextEditor 
                content={formData.description} 
                onChange={(content) => setFormData({...formData, description: content})} 
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-card/30 rounded-[2rem] overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5"><CardTitle className="text-xl font-headline">Gallery Intelligence</CardTitle></CardHeader>
          <CardContent className="p-8">
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {formData.images.map((img: string | StaticImport, i: number) => (
                <div key={i} className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/5 group bg-muted shadow-lg">
                  <Image src={img} alt="Preview" fill className="object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))} className="bg-destructive text-white p-3 rounded-full shadow-2xl hover:scale-110 transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl aspect-[4/5] cursor-pointer hover:bg-white/5 border-white/10 bg-white/5 transition-all group">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                  <Upload className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase text-muted-foreground">Add Visual</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
              </label>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <Card className="border-white/5 bg-card/30 rounded-[2rem]">
          <CardHeader className="p-6 border-b border-white/5"><CardTitle className="text-lg font-headline text-primary flex items-center gap-2"><Zap className="h-4 w-4" /> Market Alignment</CardTitle></CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Classification</Label>
              <Select value={formData.categoryId} onValueChange={(val) => setFormData({...formData, categoryId: val})}>
                <SelectTrigger className="h-12 bg-background/50 rounded-xl"><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Price (INR)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} className="h-14 bg-background/50 rounded-2xl pl-10 text-xl font-bold font-headline tabular-nums" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Delivery Artifact</Label>
              <div className="flex gap-2">
                <div className="h-12 flex-1 bg-muted/30 border border-white/5 rounded-xl flex items-center px-4 font-mono text-[10px] text-muted-foreground truncate">
                  {formData.fileKey ? 'VAULT_SYNCED' : 'PENDING'}
                </div>
                <Button type="button" variant="outline" className="h-12 relative px-4 rounded-xl border-white/10">
                  <Upload className="h-4 w-4" />
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'file')} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-16 text-xl font-bold rounded-2xl shadow-2xl shadow-primary/30 group" disabled={isSaving}>
          {isSaving ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <CheckCircle2 className="h-6 w-6 mr-3" />}
          {id ? 'Sync Changes' : 'Deploy Product'}
        </Button>
      </div>
    </form>
  );
}
