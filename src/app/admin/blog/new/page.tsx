'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useUser, useAuth } from '@/firebase';
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

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  return json.success ? json.data : [];
};

export default function NewBlogPostPage() {
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetcher('/api/categories'),
  });
  const [form, setForm] = useState<BlogPostForm>(emptyForm);

  const handleSubmit = async (data: BlogPostForm) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ...data,
          authorId: user.uid,
          authorName: data.authorName || user.displayName || 'Prontly Editorial',
          tags: data.tags.split(',').map((t) => t.trim()).filter(Boolean),
          status: data.status,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Save failed');

      toast({ title: 'Article published', description: 'Blog post saved successfully.' });
      router.push('/admin/blog');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: error?.message });
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
