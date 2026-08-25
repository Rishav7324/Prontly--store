'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { BlogEditor, type BlogPostForm } from '@/components/admin/BlogEditor';

const emptyForm: BlogPostForm = {
  title: '',
  slug: '',
  content: '',
  excerpt: '',
  featuredImage: '',
  status: 'draft',
  tags: '',
  authorName: '',
  categoryId: '',
};

export default function NewBlogPostPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const { data: categories } = useCollection(db ? collection(db, 'categories') : null);
  const [form, setForm] = useState<BlogPostForm>(emptyForm);

  const handleSubmit = async (data: BlogPostForm) => {
    if (!db || !user) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'blog_posts'), {
        ...data,
        authorId: user.uid,
        authorName: data.authorName || user.displayName || 'Prontly Editorial',
        tags: data.tags.split(',').map((t) => t.trim()).filter(Boolean),
        faqItems: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        viewCount: 0,
        publishedAt: data.status === 'published' ? serverTimestamp() : null,
      });
      toast({ title: 'Article published', description: 'Blog post saved successfully.' });
      router.push('/admin/blog');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Save failed' });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 min-w-0 max-w-full">
      <header className="flex items-center gap-3 min-w-0">
        <Button variant="outline" size="icon" asChild className="h-9 w-9 rounded-lg shrink-0 bg-background">
          <Link href="/admin/blog"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-semibold truncate">New Article</h1>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 font-mono truncate">store.prontly.in/blog/{form.slug || '...'}</p>
        </div>
      </header>

      <BlogEditor
        form={form}
        onFormChange={setForm}
        categories={(categories as any[]) || []}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        editMode={false}
      />
    </div>
  );
}
