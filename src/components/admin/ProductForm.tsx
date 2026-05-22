
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection } from '@/firebase';
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
import { Loader2, Upload, Trash2, Image as ImageIcon, File as FileIcon, Globe, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getUploadUrl } from '@/app/actions/r2-actions';
import Image from 'next/image';

interface ProductFormProps {
  initialData?: any;
  id?: string;
}

export function ProductForm({ initialData, id }: ProductFormProps) {
  const router = useRouter();
  const db = useFirestore();
  const [isSaving, setIsSaving] = useState(false);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileId = Math.random().toString(36).substring(7);
    const fileName = `${type}s/${Date.now()}-${file.name}`;
    
    try {
      setUploadProgress(prev => ({ ...prev, [fileId]: 10 }));
      const { url } = await getUploadUrl(fileName, file.type);
      
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url, true);
      xhr.setRequestHeader('Content-Type', file.type);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(prev => ({ ...prev, [fileId]: percent }));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://cdn.prontly.in'}/${fileName}`;
          if (type === 'image') {
            setFormData(prev => ({ ...prev, images: [...prev.images, publicUrl] }));
          } else {
            setFormData(prev => ({ ...prev, fileKey: publicUrl }));
          }
          toast({ title: "Upload Success", description: `${file.name} uploaded.` });
        }
      };
      
      xhr.send(file);
    } catch (error) {
      toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload file to R2." });
    } finally {
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[fileId];
          return newProgress;
        });
      }, 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
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
      };

      if (id) {
        await setDoc(doc(db, 'products', id), productData, { merge: true });
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: serverTimestamp(),
          salesCount: 0,
          downloadCount: 0
        });
      }

      toast({ title: "Success", description: id ? "Product updated." : "Product created." });
      router.push('/admin/products');
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save product." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
      <div className="lg:col-span-2 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" value={formData.name} onChange={handleNameChange} required placeholder="e.g. Master AI Prompt Kit" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input id="slug" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} required placeholder="master-ai-prompt-kit" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input id="shortDescription" value={formData.shortDescription} onChange={(e) => setFormData({...formData, shortDescription: e.target.value})} placeholder="One-line summary for grids" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Full Description (HTML Supported)</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="min-h-[200px]" placeholder="Detailed product features..." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assets & Media</CardTitle>
            <CardDescription>Upload preview images and the actual digital product file.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Product Gallery</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {formData.images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border group">
                    <Image src={img} alt="Preview" fill className="object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, idx) => idx !== i) }))}
                      className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg aspect-square cursor-pointer hover:bg-muted transition-colors">
                  <ImageIcon className="h-6 w-6 text-muted-foreground mb-2" />
                  <span className="text-[10px] text-muted-foreground">Add Image</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Digital Product File (ZIP, PDF, etc.)</Label>
              <div className="flex items-center gap-4">
                <Input 
                  value={formData.fileKey} 
                  readOnly 
                  placeholder="No file uploaded" 
                  className="bg-muted cursor-default"
                />
                <Button type="button" variant="outline" className="relative overflow-hidden">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'file')} />
                </Button>
              </div>
            </div>

            {Object.keys(uploadProgress).map(id => (
              <div key={id} className="space-y-1">
                <div className="flex justify-between text-[10px] font-medium">
                  <span>Uploading asset...</span>
                  <span>{uploadProgress[id]}%</span>
                </div>
                <Progress value={uploadProgress[id]} className="h-1" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.categoryId} onValueChange={(val) => setFormData({...formData, categoryId: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input id="tags" value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} placeholder="ai, design, react" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Price (INR)</Label>
              <Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: Number(e.target.value)})} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comparePrice">Compare-at Price (INR)</Label>
              <Input id="comparePrice" type="number" step="0.01" value={formData.compareAtPrice} onChange={(e) => setFormData({...formData, compareAtPrice: Number(e.target.value)})} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="published" checked={formData.isPublished} onCheckedChange={(checked) => setFormData({...formData, isPublished: !!checked})} />
              <Label htmlFor="published">Make Live on Store</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="featured" checked={formData.isFeatured} onCheckedChange={(checked) => setFormData({...formData, isFeatured: !!checked})} />
              <Label htmlFor="featured">Feature on Homepage</Label>
            </div>
            <Button type="submit" className="w-full h-12" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Product'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
