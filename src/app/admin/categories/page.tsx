'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
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
  MoreVertical,
  ArrowRight
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

export default function AdminCategories() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
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

  const filteredCategories = categories?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    if (editingCategory) {
      const ref = doc(db, 'categories', editingCategory.id);
      await updateDoc(ref, {
        ...formData,
        updatedAt: serverTimestamp()
      });
    } else {
      await addDoc(collection(db, 'categories'), {
        ...formData,
        isActive: true,
        productCount: 0,
        createdAt: serverTimestamp()
      });
    }

    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', slug: '', iconEmoji: '📦', description: '' });
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm('Are you sure you want to delete this category?')) return;
    await deleteDoc(doc(db, 'categories', id));
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
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Categories</h1>
          <p className="text-muted-foreground">Organize your digital products into logical groups.</p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
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
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Category Name</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. AI Prompts"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input 
                  id="slug" 
                  value={formData.slug} 
                  onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-')})} 
                  placeholder="ai-prompts"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="iconEmoji">Icon (Emoji)</Label>
                <Input 
                  id="iconEmoji" 
                  value={formData.iconEmoji} 
                  onChange={(e) => setFormData({...formData, iconEmoji: e.target.value})} 
                  placeholder="📦"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  placeholder="Short description..."
                />
              </div>
              <DialogFooter>
                <Button type="submit">{editingCategory ? 'Save Changes' : 'Create Category'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <Card>
        <CardHeader className="p-4 border-b">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search categories..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 w-full animate-pulse bg-muted rounded" />
              ))}
            </div>
          ) : filteredCategories && filteredCategories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Icon</TableHead>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category: any) => (
                  <TableRow key={category.id}>
                    <TableCell className="text-2xl">{category.iconEmoji || '📦'}</TableCell>
                    <TableCell className="font-bold">{category.name}</TableCell>
                    <TableCell className="font-code text-xs text-muted-foreground">/{category.slug}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{category.productCount || 0} items</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(category.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-60 flex-col items-center justify-center text-center p-8">
              <Layers className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-xl font-bold font-headline">No categories yet</h3>
              <p className="text-muted-foreground mb-6">Categorize your products to help customers find what they need.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
