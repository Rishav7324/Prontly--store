'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Search, 
  Layers, 
  Edit, 
  Trash2
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { logAdminAction } from '@/lib/admin-logs';

export default function AdminCategories() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const { user } = useUser();
  const db = useFirestore();
  
  const categoriesQuery = useMemoFirebase(() => {
    return db ? query(collection(db, 'categories'), orderBy('createdAt', 'desc')) : null;
  }, [db]);

  const { data: categories, loading } = useCollection(categoriesQuery);

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

  const filteredCategories = categories?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;

    if (editingCategory) {
      const ref = doc(db, 'categories', editingCategory.id);
      updateDoc(ref, {
        ...formData,
        updatedAt: serverTimestamp()
      }).then(() => {
        logAdminAction({
          db, adminId: user.uid, adminEmail: user.email!,
          action: 'UPDATE', resourceType: 'CATEGORY', resourceId: editingCategory.id, details: { name: formData.name }
        });
      }).catch(async () => {
        const permissionError = new FirestorePermissionError({
          path: ref.path,
          operation: 'update',
          requestResourceData: formData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
    } else {
      const collRef = collection(db, 'categories');
      addDoc(collRef, {
        ...formData,
        isActive: true,
        productCount: 0,
        createdAt: serverTimestamp()
      }).then((docRef) => {
        logAdminAction({
          db, adminId: user.uid, adminEmail: user.email!,
          action: 'CREATE', resourceType: 'CATEGORY', resourceId: docRef.id, details: { name: formData.name }
        });
      }).catch(async () => {
        const permissionError = new FirestorePermissionError({
          path: 'categories',
          operation: 'create',
          requestResourceData: formData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
    }

    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', slug: '', iconEmoji: '📦', description: '' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!db || !user || !confirm('Are you sure you want to delete this category?')) return;
    const ref = doc(db, 'categories', id);
    deleteDoc(ref).then(() => {
      logAdminAction({
        db, adminId: user.uid, adminEmail: user.email!,
        action: 'DELETE', resourceType: 'CATEGORY', resourceId: id, details: { name }
      });
    }).catch(async () => {
      const permissionError = new FirestorePermissionError({
        path: ref.path,
        operation: 'delete',
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    });
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
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-semibold">Categories</h1>
          <p className="text-xs text-muted-foreground">Organize your digital products into logical groups.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 rounded-lg" onClick={() => {
              setEditingCategory(null);
              setFormData({ name: '', slug: '', iconEmoji: '📦', description: '' });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              New Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Create New Category'}</DialogTitle>
              <DialogDescription>Define a name and identifier for your product category.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="name" className="text-[10px] font-medium text-muted-foreground">Category Name</Label>
                <Input 
                  id="name" 
                  className="h-9 rounded-lg"
                  value={formData.name} 
                  onChange={handleNameChange} 
                  placeholder="e.g. AI Prompts"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="slug" className="text-[10px] font-medium text-muted-foreground">URL Slug</Label>
                <Input 
                  id="slug" 
                  className="h-9 rounded-lg"
                  value={formData.slug} 
                  onChange={(e) => setFormData({...formData, slug: e.target.value})} 
                  placeholder="ai-prompts"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="iconEmoji" className="text-[10px] font-medium text-muted-foreground">Icon (Emoji)</Label>
                <Input 
                  id="iconEmoji" 
                  className="h-9 rounded-lg"
                  value={formData.iconEmoji} 
                  onChange={(e) => setFormData({...formData, iconEmoji: e.target.value})} 
                  placeholder="📦"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="description" className="text-[10px] font-medium text-muted-foreground">Description</Label>
                <Input 
                  id="description" 
                  className="h-9 rounded-lg"
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  placeholder="Short description..."
                />
              </div>
              <DialogFooter>
                <Button type="submit" size="sm" className="h-8 rounded-lg">{editingCategory ? 'Save Changes' : 'Create Category'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <Card className="rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="p-4 border-b">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search categories..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 rounded-lg"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse bg-muted rounded-lg" />
              ))}
            </div>
          ) : filteredCategories && filteredCategories.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="pl-4 w-14">Icon</TableHead>
                    <TableHead>Category Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category: any) => (
                    <TableRow key={category.id}>
                      <TableCell className="pl-4 px-3 py-2 text-base">{category.iconEmoji || '📦'}</TableCell>
                      <TableCell className="text-xs font-medium px-3 py-2">{category.name}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground px-3 py-2">/{category.slug}</TableCell>
                      <TableCell className="px-3 py-2">
                        <Badge variant="secondary" className="text-[10px] font-medium">{category.productCount || 0} items</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-4 px-3 py-2">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleEdit(category)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(category.id, category.name)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-60 flex-col items-center justify-center text-center p-8">
              <Layers className="h-10 w-10 text-muted-foreground mb-3 opacity-20" />
              <h3 className="text-sm font-semibold">No categories yet</h3>
              <p className="text-xs text-muted-foreground mt-1">Categorize your products to help customers find what they need.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
