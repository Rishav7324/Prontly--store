'use client';

import { useState, useEffect, useRef, Key } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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
  Zap, 
  ShieldCheck, 
  Search, 
  FileCode, 
  Info 
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

  // Initialize state directly from initialData if available
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    shortDescription: initialData?.shortDescription || '',
    categoryId: initialData?.categoryId || '',
    categorySlug: initialData?.categorySlug || '',
    tags: Array.isArray(initialData?.tags) ? initialData.tags.join(', ') : '',
    price: initialData?.price ? initialData.price / 100 : 0,
    compareAtPrice: initialData?.compareAtPrice ? initialData.compareAtPrice / 100 : 0,
    images: initialData?.images || [],
    bannerImage: initialData?.bannerImage || '',
    fileKey: initialData?.fileKey || '',
    previewFileKey: initialData?.previewFileKey || '',
    fileSize: initialData?.fileSize || 0,
    fileFormat: initialData?.fileFormat || 'ZIP',
    fileVersion: initialData?.fileVersion || '1.0',
    isPublished: initialData?.isPublished ?? true,
    isFeatured: initialData?.isFeatured ?? false,
    seo: {
      title: initialData?.seo?.title || '',
      description: initialData?.seo?.description || '',
      canonicalUrl: initialData?.seo?.canonicalUrl || '',
      ogImage: initialData?.seo?.ogImage || '',
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'source' | 'preview' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file || !formData.name) return;

    const tempSlug = formData.slug || generateSlug(formData.name);
    
    try {
      let uploadFile = file;
      let finalKey = "";

      if (type === 'image' || type === 'banner') {
        const optimized = await optimizeImage(file);
        uploadFile = new File([optimized.blob], `${tempSlug}-${Date.now()}.webp`, { type: 'image/webp' });
        finalKey = `products/${type}s/${tempSlug}/${uploadFile.name}`;
      } else {
        const ext = file.name.split('.').pop();
        finalKey = `products/files/${type}/${tempSlug}-${type}.${ext}`;
      }
      
      const uploadFormData = new FormData();
      uploadFormData.append('file', uploadFile);
      uploadFormData.append('key', finalKey);

      const result = await uploadFileAction(uploadFormData);

      if (result.success && result.url) {
        if (type === 'image') setFormData(prev => ({ ...prev, images: [...prev.images, result.url!] }));
        if (type === 'banner') setFormData(prev => ({ ...prev, bannerImage: result.url! }));
        if (type === 'source') setFormData(prev => ({ ...prev, fileKey: result.url!, fileSize: uploadFile.size }));
        if (type === 'preview') setFormData(prev => ({ ...prev, previewFileKey: result.url! }));
        
        toast({ title: "Resource Synced", description: file.name });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Fault" });
    }
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
          title: prev.name,
          description: result.shortDescription
        }
      }));
      toast({ title: "AI Forge Active", description: "Product description synchronized." });
    } catch (error) {
      toast({ variant: "destructive", title: "AI Generation Fault" });
    } finally {
      setIsGenerating(false);
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
      price: Math.round(Number(formData.price) * 100),
      compareAtPrice: Math.round(Number(formData.compareAtPrice) * 100),
      categorySlug: selectedCategory?.slug || '',
      tags: typeof formData.tags === 'string' ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
      updatedAt: serverTimestamp(),
      createdBy: id ? (initialData?.createdBy || user.uid) : user.uid,
      ...(id ? {} : { 
        createdAt: serverTimestamp(),
        downloadCount: 0,
        salesCount: 0,
        averageRating: 5.0,
        reviewCount: 0
      }),
    };

    const docRef = id ? doc(db, 'products', id) : doc(collection(db, 'products'));

    setDoc(docRef, productData, { merge: true })
      .then(() => {
        logAdminAction({
          db, adminId: user.uid, adminEmail: user.email!,
          action: id ? 'UPDATE' : 'CREATE', resourceType: 'PRODUCT', resourceId: docRef.id, details: { name: formData.name, slug: slugToSave }
        });
        toast({ title: `Record Synchronized`, description: `Product ${formData.name} is now live.` });
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
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-40 animate-in fade-in duration-500">
      <div className="lg:col-span-8 space-y-8">
        <Card className="border-white/5 bg-card/30 rounded-[2rem] overflow-hidden shadow-2xl">
          <CardHeader className="p-4 sm:p-8 border-b border-white/5 bg-muted/20 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-1xl font-headline text-midnight-ink">Product Specifications</CardTitle>
              <CardDescription>Primary asset identity and description.</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAiGenerate} disabled={isGenerating} className="gap-2 rounded-xl h-10 border-primary/20 text-primary hover:bg-primary/5 transition-all">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              AI Assistant
            </Button>
          </CardHeader>
          <CardContent className="p-4 sm:p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Asset Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value, slug: isSlugLocked ? formData.slug : generateSlug(e.target.value)})} required className="h-14 bg-background/50 rounded-2xl text-lg font-bold" />
              </div>
              <div className="grid gap-2">
                <Label className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  SEO Slug
                  <button type="button" onClick={() => setIsSlugLocked(!isSlugLocked)} className="text-[9px] text-primary flex items-center gap-1 hover:underline">
                    {isSlugLocked ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                    {isSlugLocked ? 'Unlock' : 'Lock'}
                  </button>
                </Label>
                <Input value={formData.slug} onChange={(e) => setFormData({...formData, slug: generateSlug(e.target.value)})} readOnly={isSlugLocked} className={cn("h-14 bg-background/50 rounded-2xl font-mono text-sm", isSlugLocked && "opacity-50")} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Card Summary (Short Description)</Label>
              <Textarea value={formData.shortDescription} onChange={(e) => setFormData({...formData, shortDescription: e.target.value})} maxLength={200} className="h-24 bg-background/50 rounded-xl resize-none" placeholder="Enter a punchy 200-character overview..." />
            </div>

            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Workflows & Documentation</Label>
              <RichTextEditor content={formData.description} onChange={(c) => setFormData({...formData, description: c})} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-card/30 rounded-[2rem] overflow-hidden shadow-2xl">
          <CardHeader className="p-4 sm:p-8 border-b border-white/5 bg-muted/20"><CardTitle className="text-xl font-headline text-midnight-ink">Visuals & Files</CardTitle></CardHeader>
          <CardContent className="p-4 sm:p-8 space-y-8">
            <div className="grid gap-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gallery Images (Max 5)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {formData.images.map((img: string | StaticImport, i: Key | null | undefined) => (
                  <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-white/5 group bg-muted shadow-lg">
                    <Image src={img} alt="Preview" fill className="object-cover" />
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_: any, idx: any) => idx !== i) }))} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                {formData.images.length < 5 && (
                  <label className="aspect-square border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 border-white/10 transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                    <span className="text-[8px] font-bold uppercase text-muted-foreground">Upload</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
                  </label>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Main Asset File (Private)</Label>
                <div className="flex gap-2">
                  <div className="h-12 flex-1 bg-muted/30 border border-white/5 rounded-xl flex items-center px-4 font-mono text-[9px] text-muted-foreground truncate">
                    {formData.fileKey ? 'SYNCED: ' + formData.fileKey.split('/').pop() : 'AWAITING_UPLOAD'}
                  </div>
                  <Button type="button" variant="outline" className="h-12 px-4 rounded-xl relative overflow-hidden border-white/10">
                    <Upload className="h-4 w-4" />
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'source')} />
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Preview Asset (Public)</Label>
                <div className="flex gap-2">
                  <div className="h-12 flex-1 bg-muted/30 border border-white/5 rounded-xl flex items-center px-4 font-mono text-[9px] text-muted-foreground truncate">
                    {formData.previewFileKey ? 'SYNCED: ' + formData.previewFileKey.split('/').pop() : 'OPTIONAL'}
                  </div>
                  <Button type="button" variant="outline" className="h-12 px-4 rounded-xl relative overflow-hidden border-white/10">
                    <Upload className="h-4 w-4" />
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'preview')} />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-4 space-y-8">
        <Card className="border-white/5 bg-card/30 rounded-[2.5rem] shadow-xl overflow-hidden">
          <CardHeader className="p-6 border-b border-white/5 bg-primary/5">
            <CardTitle className="text-lg font-headline text-primary flex items-center gap-2"><Zap className="h-4 w-4" /> Pricing & Meta</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Category</Label>
              <Select value={formData.categoryId} onValueChange={(val) => setFormData({...formData, categoryId: val})}>
                <SelectTrigger className="h-12 bg-background/50 rounded-xl"><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Price (INR)</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                  <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} className="h-12 bg-background/50 rounded-xl pl-8 font-bold" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Strike Price</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                  <Input type="number" value={formData.compareAtPrice} onChange={(e) => setFormData({...formData, compareAtPrice: Number(e.target.value)})} className="h-12 bg-background/50 rounded-xl pl-8 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Asset Format & Version</Label>
              <div className="flex gap-2">
                <Input value={formData.fileFormat} onChange={(e) => setFormData({...formData, fileFormat: e.target.value.toUpperCase()})} className="h-12 bg-background/50 rounded-xl font-mono text-xs" placeholder="ZIP, PDF..." />
                <Input value={formData.fileVersion} onChange={(e) => setFormData({...formData, fileVersion: e.target.value})} className="h-12 bg-background/50 rounded-xl font-mono text-xs" placeholder="v1.0" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Search Tags</Label>
              <Input value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} className="h-12 bg-background/50 rounded-xl text-xs" placeholder="ai, guide, toolkit..." />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-card/30 rounded-[2.5rem] shadow-xl overflow-hidden">
          <CardHeader className="p-6 border-b border-white/5 bg-muted/30">
            <CardTitle className="text-lg font-headline text-midnight-ink flex items-center gap-2"><Globe className="h-4 w-4" /> SEO Terminal</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Meta Title Override</Label>
              <Input value={formData.seo?.title} onChange={(e) => setFormData({...formData, seo: {...formData.seo, title: e.target.value}})} className="h-10 bg-background/50 rounded-lg text-xs" />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Meta Description</Label>
              <Textarea value={formData.seo?.description} onChange={(e) => setFormData({...formData, seo: {...formData.seo, description: e.target.value}})} className="h-20 bg-background/50 rounded-lg text-xs resize-none" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/5 bg-card/30 rounded-[2.5rem] shadow-xl overflow-hidden">
          <CardHeader className="p-6 border-b border-white/5 bg-muted/30"><CardTitle className="text-lg font-headline text-midnight-ink">Publishing</CardTitle></CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="space-y-1">
                <p className="text-xs font-bold text-midnight-ink">Active Visibility</p>
                <p className="text-[10px] text-muted-foreground uppercase">Show in catalog</p>
              </div>
              <Switch checked={formData.isPublished} onCheckedChange={(val) => setFormData({...formData, isPublished: val})} />
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <div className="space-y-1">
                <p className="text-xs font-bold text-primary">Featured Product</p>
                <p className="text-[10px] text-primary/60 uppercase">Homepage placement</p>
              </div>
              <Switch checked={formData.isFeatured} onCheckedChange={(val) => setFormData({...formData, isFeatured: val})} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSaving} className="w-full h-16 rounded-2xl text-lg font-bold shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 group">
          {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <CheckCircle2 className="h-5 w-5 mr-3" />}
          {id ? 'Synchronize Record' : 'Deploy Product'}
        </Button>
      </div>
    </form>
  );
}