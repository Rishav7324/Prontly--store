'use client';

import { useState, useEffect } from 'react';
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
  RefreshCw,
  Globe
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

interface ProductFormProps {
  initialData?: any;
  id?: string; // This is the Firestore document ID
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
        toast({ title: "Resource Linked" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Fault" });
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
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      updatedAt: serverTimestamp(),
      bannerImage: formData.images[0] || '',
    };

    // If id is provided, we are UPDATING the document at that ID.
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
          action: id ? 'UPDATE' : 'CREATE', resourceType: 'PRODUCT', resourceId: docRef.id, details: { name: formData.name, slug: slugToSave }
        });
        toast({ title: `Asset ${id ? 'Synchronized' : 'Deployed'}` });
        router.push('/admin/products');
      })
      .catch(async () => {
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
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-32">
      <div className="lg:col-span-2 space-y-8">
        <Card className="border-white/5 bg-card/30 rounded-[2rem]">
          <CardHeader className="flex flex-row items-center justify-between p-8 border-b border-white/5">
            <div>
              <CardTitle className="text-2xl font-headline">Intelligence Specs</CardTitle>
              <CardDescription>Configure core asset parameters and SEO routing.</CardDescription>
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
              AI Agent
            </Button>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid gap-3">
              <Label htmlFor="name" className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Asset Headline</Label>
              <Input id="name" value={formData.name} onChange={handleNameChange} required className="h-14 bg-background/50 rounded-2xl text-lg font-bold" placeholder="e.g. Master AI Prompt Engineering" />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="slug" className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">
                <span>Dynamic Path (Slug)</span>
                <button type="button" onClick={() => setIsSlugLocked(!isSlugLocked)} className="text-[9px] font-black text-primary flex items-center gap-1 uppercase hover:opacity-70 transition-opacity">
                  {isSlugLocked ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                  {isSlugLocked ? 'Edit Path' : 'Lock Path'}
                </button>
              </Label>
              <div className="relative group">
                <Input 
                  id="slug" 
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
              <p className="text-[10px] font-bold text-muted-foreground/60 italic ml-1">
                URL Preview: <span className="text-primary font-black">store.prontly.in/products/{formData.slug || '...'}</span>
              </p>
            </div>

            <div className="grid gap-3">
              <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground ml-1">Technical Documentation</Label>
              <RichTextEditor 
                content={formData.description} 
                onChange={(content) => setFormData({...formData, description: content})} 
                className="min-h-[400px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-card/30 rounded-[2rem] overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5"><CardTitle className="text-xl font-headline">Visual Intelligence</CardTitle></CardHeader>
          <CardContent className="p-8">
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {formData.images.map((img, i) => (
                <div key={i} className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/5 group bg-muted shadow-lg">
                  <Image src={img} alt="Preview" fill className="object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))} className="bg-destructive text-white p-3 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl aspect-[4/5] cursor-pointer hover:bg-white/5 border-white/10 bg-white/5 transition-all group">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform mb-3">
                  <Upload className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Add Asset</span>
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
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Asset Classification</Label>
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
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Capital Value (INR)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} className="h-14 bg-background/50 rounded-2xl pl-10 text-xl font-bold font-headline" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Source File Status</Label>
              <div className="flex gap-2">
                <div className="h-12 flex-1 bg-muted/30 border border-white/5 rounded-xl flex items-center px-4 font-mono text-[10px] text-muted-foreground truncate">
                  {formData.fileKey ? 'ENCRYPTED_VAULT_READY' : 'PENDING_ATTACHMENT'}
                </div>
                <Button type="button" variant="outline" className="h-12 relative px-4 rounded-xl border-white/10 hover:bg-white/5">
                  <Upload className="h-4 w-4" />
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'file')} />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-16 text-xl font-bold rounded-2xl shadow-2xl shadow-primary/30 group" disabled={isSaving}>
          {isSaving ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <CheckCircle2 className="h-6 w-6 mr-3 transition-transform group-hover:scale-110" />}
          {id ? 'Sync Parameters' : 'Deploy Infrastructure'}
        </Button>
      </div>
    </form>
  );
}
