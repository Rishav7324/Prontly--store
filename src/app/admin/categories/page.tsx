'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Search,
  Layers,
  Edit,
  Trash2,
  X,
  Sparkles,
  FolderOpen
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { logAdminAction } from '@/lib/admin-logs';
import { toast } from '@/hooks/use-toast';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  return json.success ? json.data : [];
};

export default function AdminCategories() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => fetcher('/api/admin/categories'),
    refetchInterval: 30000,
  });

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    iconEmoji: '📦',
    description: ''
  });

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const filteredCategories = (categories as any[]).filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-categories'] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      let resourceId = editingCategory?.id || '';
      if (editingCategory) {
        const res = await fetch('/api/admin/categories', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingCategory.id, ...formData }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Update failed');
        logAdminAction({
          adminId: user.uid, adminEmail: user.email || 'unknown',
          action: 'UPDATE', resourceType: 'CATEGORY', resourceId, details: { name: formData.name }
        });
      } else {
        const res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Create failed');
        resourceId = json.data?.id || '';
        logAdminAction({
          adminId: user.uid, adminEmail: user.email || 'unknown',
          action: 'CREATE', resourceType: 'CATEGORY', resourceId, details: { name: formData.name }
        });
      }

      toast({ title: editingCategory ? 'Category Updated' : 'Category Created' });
      setIsModalOpen(false);
      setEditingCategory(null);
      setFormData({ name: '', slug: '', iconEmoji: '📦', description: '' });
      refresh();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Operation Failed', description: error?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!user || !confirm(`Permanently delete category "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/categories?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Delete failed');
      logAdminAction({
        adminId: user.uid, adminEmail: user.email || 'unknown',
        action: 'DELETE', resourceType: 'CATEGORY', resourceId: id, details: { name }
      });
      toast({ title: 'Category Deleted' });
      refresh();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: error?.message });
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      iconEmoji: category.iconEmoji || '📦',
      description: category.description || ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-bold text-accent mb-1.5 uppercase">
            TAXONOMY & ARCHITECTURE
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-headline">
            Product Categories
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Organize digital products into structured verticals and marketplace filters.
          </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              className="h-10 rounded-2xl px-4 text-xs font-bold bg-zinc-950 text-white hover:bg-zinc-800 shadow-md active:scale-[0.98] transition-all" 
              onClick={() => {
                setEditingCategory(null);
                setFormData({ name: '', slug: '', iconEmoji: '📦', description: '' });
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl p-6 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold font-headline">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Define the display title, URL identifier slug, and emoji avatar.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="name" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Display Name</Label>
                <Input
                  id="name"
                  className="h-10 rounded-xl text-xs"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g. Midjourney Prompts"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="slug" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">URL Slug</Label>
                <Input
                  id="slug"
                  className="h-10 rounded-xl text-xs font-mono"
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                  placeholder="midjourney-prompts"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="iconEmoji" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Emoji Badge</Label>
                <Input
                  id="iconEmoji"
                  className="h-10 rounded-xl text-xs"
                  value={formData.iconEmoji}
                  onChange={(e) => setFormData({...formData, iconEmoji: e.target.value})}
                  placeholder="🎨"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="description" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Short Description</Label>
                <Input
                  id="description"
                  className="h-10 rounded-xl text-xs"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Short tagline for marketplace filters..."
                />
              </div>
              <DialogFooter className="pt-2">
                <Button type="submit" size="sm" disabled={isSubmitting} className="h-10 rounded-xl px-5 text-xs font-bold bg-zinc-950 text-white">
                  {isSubmitting ? 'Saving…' : editingCategory ? 'Save Changes' : 'Create Category'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Table Card */}
      <Card className="rounded-3xl border border-border/80 bg-white shadow-xs overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search categories by title, slug…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9.5 pr-8 h-10 rounded-2xl bg-white border-border/80 text-xs focus-visible:ring-1 focus-visible:ring-accent shadow-2xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <p className="text-xs text-muted-foreground font-medium shrink-0">
              Showing {filteredCategories.length} categories
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 w-full animate-pulse bg-muted rounded-2xl" />
              ))}
            </div>
          ) : filteredCategories.length > 0 ? (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="px-6 py-3.5 text-xs font-bold text-muted-foreground w-16">Icon</TableHead>
                      <TableHead className="px-6 py-3.5 text-xs font-bold text-muted-foreground">Category Name</TableHead>
                      <TableHead className="px-6 py-3.5 text-xs font-bold text-muted-foreground">URL Slug</TableHead>
                      <TableHead className="px-6 py-3.5 text-xs font-bold text-muted-foreground">Catalog Index</TableHead>
                      <TableHead className="px-6 py-3.5 text-right text-xs font-bold text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category: any) => (
                      <TableRow key={category.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="px-6 py-3.5 text-lg">
                          <span className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center border border-border/60">
                            {category.iconEmoji || '📦'}
                          </span>
                        </TableCell>
                        <TableCell className="px-6 py-3.5">
                          <span className="text-xs sm:text-sm font-bold text-foreground">{category.name}</span>
                          {category.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1">{category.description}</p>
                          )}
                        </TableCell>
                        <TableCell className="px-6 py-3.5">
                          <code className="text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md font-mono border border-border/50">
                            /{category.slug}
                          </code>
                        </TableCell>
                        <TableCell className="px-6 py-3.5">
                          <Badge variant="secondary" className="text-[10px] font-bold bg-accent/10 text-accent px-2.5 py-0.5 rounded-full">
                            {category.productCount || 0} assets
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-3.5 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8.5 w-8.5 rounded-xl hover:border-border/70" onClick={() => handleEdit(category)}>
                              <Edit className="h-4 w-4 text-accent" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8.5 w-8.5 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive" 
                              onClick={() => handleDelete(category.id, category.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-border/60">
                {filteredCategories.map((category: any) => (
                  <div key={category.id} className="p-4 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-lg border border-border/60 shrink-0">
                        {category.iconEmoji || '📦'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">{category.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">/{category.slug}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8.5 w-8.5 rounded-xl" onClick={() => handleEdit(category)}>
                        <Edit className="h-4 w-4 text-accent" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8.5 w-8.5 rounded-xl text-destructive hover:bg-destructive/10" 
                        onClick={() => handleDelete(category.id, category.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-56 flex-col items-center justify-center text-center p-8">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-3 opacity-25" />
              <h3 className="text-sm font-bold text-foreground">No Categories Yet</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                Create structured category buckets to help buyers navigate prompts and assets.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
