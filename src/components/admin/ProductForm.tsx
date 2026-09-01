'use client';

import { useState, useRef, Key, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useUser, useAuth } from '@/firebase';
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
  Sparkles,
  CheckCircle2,
  Lock,
  Globe,
  Zap
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { uploadFileAction } from '@/app/actions/r2-actions';
import { uploadFileDirectlyToR2 } from '@/lib/upload/direct-upload';
import { logAdminAction } from '@/lib/admin-logs';
import { generateProductCopy } from '@/ai/flows/generate-product-copy';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import { cn, generateSlug } from '@/lib/utils';
import { optimizeImage } from '@/lib/image-optimizer';
import Image from 'next/image';
import { StaticImport } from 'next/dist/shared/lib/get-img-props';

interface ProductFormProps {
  initialData?: any;
  id?: string;
}

export function ProductForm({ initialData, id }: ProductFormProps) {
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSlugLocked, setIsSlugLocked] = useState(!!id);
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({});
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  // Initialize state directly from initialData if available (prices stored in paise → shown in rupees)
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

  // When category list arrives after mount, resolve the slug for a preselected id
  useEffect(() => {
    if (!id && !formData.categoryId && categories.length === 1) {
      setFormData(prev => ({ ...prev, categoryId: categories[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'source' | 'preview' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!formData.name.trim()) {
      toast({ 
        variant: "destructive", 
        title: "Product Name Required", 
        description: "Please enter the asset name before uploading files." 
      });
      return;
    }

    const tempSlug = formData.slug || generateSlug(formData.name);
    setIsUploading(prev => ({ ...prev, [type]: true }));
    setUploadProgress(prev => ({ ...prev, [type]: 0 }));

    try {
      let uploadFile = file;
      let finalKey = "";

      if (type === 'image' || type === 'banner') {
        const optimized = await optimizeImage(file);
        uploadFile = new File([optimized.blob], `${tempSlug}-${Date.now()}.webp`, { type: 'image/webp' });
        finalKey = `products/${type}s/${tempSlug}/${uploadFile.name}`;
      } else {
        const ext = file.name.split('.').pop() || 'zip';
        finalKey = `products/files/${type}/${tempSlug}-${type}-${Date.now()}.${ext}`;
      }

      const result = await uploadFileDirectlyToR2({
        file: uploadFile,
        key: finalKey,
        onProgress: (percent) => {
          setUploadProgress(prev => ({ ...prev, [type]: percent }));
        }
      });

      if (result.success && result.url) {
        if (type === 'image') setFormData(prev => ({ ...prev, images: [...prev.images, result.url!] }));
        if (type === 'banner') setFormData(prev => ({ ...prev, bannerImage: result.url! }));
        if (type === 'source') setFormData(prev => ({ 
          ...prev, 
          fileKey: result.url!, 
          fileSize: uploadFile.size,
          fileFormat: prev.fileFormat || file.name.split('.').pop()?.toUpperCase() || 'ZIP'
        }));
        if (type === 'preview') setFormData(prev => ({ ...prev, previewFileKey: result.url! }));

        const formattedSize = uploadFile.size > 1024 * 1024
          ? `${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB`
          : `${(uploadFile.size / 1024).toFixed(0)} KB`;

        toast({ title: "Upload Complete", description: `${file.name} (${formattedSize}) synced to Cloudflare R2.` });
      } else {
        throw new Error(result.error || 'Failed to upload to Cloudflare R2.');
      }
    } catch (error: any) {
      console.error('File upload error:', error);
      toast({ 
        variant: "destructive", 
        title: "Upload Failed", 
        description: error.message || "Failed to stream file to storage." 
      });
    } finally {
      setIsUploading(prev => ({ ...prev, [type]: false }));
      // Reset input element so re-selecting the same file works
      e.target.value = '';
    }
  };

  const handleAiGenerate = async () => {
    if (!formData.name) return;
    setIsGenerating(true);
    try {
      const selectedCategory = categories.find((c: any) => c.id === formData.categoryId);
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
    if (!user) return;
    setIsSaving(true);

    try {
      const slugToSave = formData.slug || generateSlug(formData.name);
      const selectedCategory = categories.find((c: any) => c.id === formData.categoryId);

      // Prices are submitted in RUPEES — the API converts to paise server-side.
      const productData = {
        name: formData.name,
        slug: slugToSave,
        description: formData.description,
        shortDescription: formData.shortDescription,
        price: Number(formData.price),
        compareAtPrice: Number(formData.compareAtPrice),
        categoryId: formData.categoryId || undefined,
        categorySlug: selectedCategory?.slug || formData.categorySlug || 'asset',
        tags: typeof formData.tags === 'string'
          ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
          : formData.tags,
        images: formData.images,
        bannerImage: formData.bannerImage || undefined,
        fileKey: formData.fileKey || undefined,
        previewFileKey: formData.previewFileKey || undefined,
        fileSize: formData.fileSize || 0,
        fileFormat: formData.fileFormat || 'ZIP',
        fileVersion: formData.fileVersion || '1.0',
        isPublished: formData.isPublished,
        isFeatured: formData.isFeatured,
        seo: formData.seo,
      };

      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(productData),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Save failed');
      }

      const savedId = json.data?.id || id || slugToSave;
      logAdminAction({
        adminId: user.uid, adminEmail: user.email || 'unknown',
        action: id ? 'UPDATE' : 'CREATE', resourceType: 'PRODUCT', resourceId: savedId, details: { name: formData.name, slug: slugToSave }
      });

      toast({ title: `Record Synchronized`, description: `Product ${formData.name} is now live.` });
      router.push('/admin/products');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save Failed", description: error?.message || 'Could not persist the product record.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-32 animate-in fade-in duration-500">
      <div className="lg:col-span-8 space-y-6">
        <Card className="rounded-xl shadow-sm p-4">
          <CardHeader className="px-0 pt-0 pb-3 flex flex-row items-center justify-between space-y-0 border-b border-border/60">
            <div>
              <CardTitle className="text-sm font-semibold">Product Specifications</CardTitle>
              <CardDescription className="text-xs mt-0.5">Primary asset identity and description.</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleAiGenerate} disabled={isGenerating} className="h-8 rounded-lg gap-1.5 text-xs font-medium text-primary hover:bg-primary/5">
              {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              AI Assistant
            </Button>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-4 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-muted-foreground">Asset Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value, slug: isSlugLocked ? formData.slug : generateSlug(e.target.value)})} required className="h-9 rounded-lg text-xs font-medium" />
              </div>
              <div className="space-y-1.5">
                <Label className="flex justify-between items-center text-[10px] font-medium text-muted-foreground">
                  SEO Slug
                  <button type="button" onClick={() => setIsSlugLocked(!isSlugLocked)} className="text-[10px] font-medium text-primary flex items-center gap-1 hover:underline normal-case">
                    {isSlugLocked ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                    {isSlugLocked ? 'Unlock' : 'Lock'}
                  </button>
                </Label>
                <Input value={formData.slug} onChange={(e) => setFormData({...formData, slug: generateSlug(e.target.value)})} readOnly={isSlugLocked} className={cn("h-9 rounded-lg font-mono text-xs", isSlugLocked && "opacity-50")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-medium text-muted-foreground">Card Summary (Short Description)</Label>
              <Textarea value={formData.shortDescription} onChange={(e) => setFormData({...formData, shortDescription: e.target.value})} maxLength={200} className="min-h-20 h-20 rounded-lg resize-none text-xs" placeholder="Enter a punchy 200-character overview..." />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-medium text-muted-foreground">Description (Rich Text)</Label>
              <RichTextEditor
                content={formData.description}
                onChange={(c) => setFormData({...formData, description: c})}
                placeholder="Describe what's included, benefits, specs…"
                uploadSlug={formData.slug || undefined}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm p-4">
          <CardHeader className="px-0 pt-0 pb-3 space-y-0 border-b border-border/60">
            <CardTitle className="text-sm font-semibold">Visuals & Files</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-4 space-y-6">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-medium text-muted-foreground">Gallery Images (Max 5)</Label>
                {isUploading.image && (
                  <span className="text-[10px] font-semibold text-primary animate-pulse flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Uploading image ({uploadProgress.image || 0}%)
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {formData.images.map((img: string | StaticImport, i: Key | null | undefined) => (
                  <div key={i} className="relative aspect-[4/5] rounded-xl overflow-hidden border border-border/60 group bg-muted shadow-sm">
                    <Image src={img} alt="Preview" fill className="object-cover" />
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_: any, idx: any) => idx !== i) }))} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                {formData.images.length < 5 && (
                  <label className={cn(
                    "aspect-[4/5] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors relative",
                    isUploading.image && "pointer-events-none opacity-60 bg-muted/30"
                  )}>
                    {isUploading.image ? (
                      <>
                        <Loader2 className="h-4 w-4 text-primary animate-spin mb-1" />
                        <span className="text-[10px] font-semibold text-primary">{uploadProgress.image || 0}%</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 text-muted-foreground mb-1" />
                        <span className="text-[10px] font-medium text-muted-foreground">Upload</span>
                      </>
                    )}
                    <input type="file" className="hidden" accept="image/*" disabled={isUploading.image} onChange={(e) => handleFileUpload(e, 'image')} />
                  </label>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-medium text-muted-foreground">Main Asset File (Private & Fast Edge)</Label>
                  {isUploading.source && (
                    <span className="text-[10px] font-bold text-primary tabular-nums">
                      {uploadProgress.source || 0}%
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="h-9 flex-1 min-w-0 bg-muted/40 border border-border/60 rounded-lg flex items-center px-3 font-mono text-[10px] text-muted-foreground truncate">
                    {isUploading.source ? (
                      <span className="text-primary font-semibold flex items-center gap-1.5 truncate">
                        <Loader2 className="h-3 w-3 animate-spin shrink-0" /> Streaming to R2 ({uploadProgress.source || 0}%)
                      </span>
                    ) : formData.fileKey ? (
                      <span className="text-foreground font-medium truncate">
                        {formData.fileKey.split('/').pop()} {formData.fileSize ? `(${(formData.fileSize / (1024 * 1024)).toFixed(1)} MB)` : ''}
                      </span>
                    ) : (
                      'Awaiting upload (ZIP, RAR, TAR, PDF up to 5GB+)'
                    )}
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    disabled={isUploading.source}
                    className="h-9 w-9 p-0 rounded-lg relative overflow-hidden shrink-0"
                  >
                    {isUploading.source ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <Upload className="h-3.5 w-3.5" />}
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                      disabled={isUploading.source}
                      onChange={(e) => handleFileUpload(e, 'source')} 
                    />
                  </Button>
                </div>
                {isUploading.source && (
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-150 rounded-full" 
                      style={{ width: `${uploadProgress.source || 0}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-medium text-muted-foreground">Preview Asset (Public)</Label>
                  {isUploading.preview && (
                    <span className="text-[10px] font-bold text-primary tabular-nums">
                      {uploadProgress.preview || 0}%
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="h-9 flex-1 min-w-0 bg-muted/40 border border-border/60 rounded-lg flex items-center px-3 font-mono text-[10px] text-muted-foreground truncate">
                    {isUploading.preview ? (
                      <span className="text-primary font-semibold flex items-center gap-1.5 truncate">
                        <Loader2 className="h-3 w-3 animate-spin shrink-0" /> Uploading ({uploadProgress.preview || 0}%)
                      </span>
                    ) : formData.previewFileKey ? (
                      <span className="text-foreground font-medium truncate">
                        {formData.previewFileKey.split('/').pop()}
                      </span>
                    ) : (
                      'Optional preview sample'
                    )}
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    disabled={isUploading.preview}
                    className="h-9 w-9 p-0 rounded-lg relative overflow-hidden shrink-0"
                  >
                    {isUploading.preview ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <Upload className="h-3.5 w-3.5" />}
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                      disabled={isUploading.preview}
                      onChange={(e) => handleFileUpload(e, 'preview')} 
                    />
                  </Button>
                </div>
                {isUploading.preview && (
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-150 rounded-full" 
                      style={{ width: `${uploadProgress.preview || 0}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <Card className="rounded-xl shadow-sm p-4">
          <CardHeader className="px-0 pt-0 pb-3 space-y-0 border-b border-border/60">
            <CardTitle className="text-sm font-semibold text-primary flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> Pricing & Meta</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-medium text-muted-foreground">Category</Label>
              <Select value={formData.categoryId} onValueChange={(val) => setFormData({...formData, categoryId: val})}>
                <SelectTrigger className="h-9 rounded-lg text-xs"><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>
                  {(categories as any[]).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-muted-foreground">Price (INR)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                  <Input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} className="h-9 rounded-lg pl-7 font-medium text-xs" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium text-muted-foreground">Strike Price</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                  <Input type="number" value={formData.compareAtPrice} onChange={(e) => setFormData({...formData, compareAtPrice: Number(e.target.value)})} className="h-9 rounded-lg pl-7 text-muted-foreground text-xs" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-medium text-muted-foreground">Asset Format & Version</Label>
              <div className="flex gap-2">
                <Input value={formData.fileFormat} onChange={(e) => setFormData({...formData, fileFormat: e.target.value.toUpperCase()})} className="h-9 rounded-lg font-mono text-xs" placeholder="ZIP, PDF..." />
                <Input value={formData.fileVersion} onChange={(e) => setFormData({...formData, fileVersion: e.target.value})} className="h-9 rounded-lg font-mono text-xs" placeholder="v1.0" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-medium text-muted-foreground">Search Tags</Label>
              <Input value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} className="h-9 rounded-lg text-xs" placeholder="ai, guide, toolkit..." />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm p-4">
          <CardHeader className="px-0 pt-0 pb-3 space-y-0 border-b border-border/60">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> SEO</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-medium text-muted-foreground">Meta Title Override</Label>
              <Input value={formData.seo?.title} onChange={(e) => setFormData({...formData, seo: {...formData.seo, title: e.target.value}})} className="h-9 rounded-lg text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-medium text-muted-foreground">Meta Description</Label>
              <Textarea value={formData.seo?.description} onChange={(e) => setFormData({...formData, seo: {...formData.seo, description: e.target.value}})} className="h-16 rounded-lg text-xs resize-none" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm p-4">
          <CardHeader className="px-0 pt-0 pb-3 space-y-0 border-b border-border/60">
            <CardTitle className="text-sm font-semibold">Publishing</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0 pt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-white/40 dark:bg-white/5 border border-border/60 p-3">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold">Active Visibility</p>
                <p className="text-[10px] font-medium text-muted-foreground">Show in catalog</p>
              </div>
              <Switch checked={formData.isPublished} onCheckedChange={(val) => setFormData({...formData, isPublished: val})} />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/15 p-3">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-primary">Featured Product</p>
                <p className="text-[10px] font-medium text-primary/70">Homepage placement</p>
              </div>
              <Switch checked={formData.isFeatured} onCheckedChange={(val) => setFormData({...formData, isFeatured: val})} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSaving} size="sm" className="w-full h-10 rounded-lg font-medium active:scale-[0.99] transition-transform sticky bottom-4">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
          {id ? 'Synchronize Record' : 'Deploy Product'}
        </Button>
      </div>
    </form>
  );
}
