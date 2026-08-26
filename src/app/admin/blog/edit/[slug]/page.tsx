'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useUser, useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { ChevronLeft, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { BlogEditor, type BlogPostForm } from '@/components/admin/BlogEditor';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const json = await res.json();
  return json.success ? json.data : [];
};

export default function EditBlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Drafts aren't served by the public GET — the list page stashes the row
  // in sessionStorage before navigating here; fall back to the API by slug.
  const { data: fetchedPost, isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: async () => {
      try {
        const cached = sessionStorage.getItem(`blog-edit-${slug}`);
        if (cached) return JSON.parse(cached);
      } catch {}
      const res = await fetch(`/api/blog?slug=${encodeURIComponent(slug)}`);
      if (res.status === 404) return null;
      const json = await res.json();
      return json.success ? json.data : null;
    },
  });

  const post = fetchedPost as any;

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetcher('/api/categories'),
  });

  const [form, setForm] = useState<BlogPostForm>({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    featuredImage: '',
    status: 'draft',
    tags: '',
    authorName: '',
    categoryId: '',
  });

  useEffect(() => {
    if (post) {
      setForm({
        title: post.title || '',
        slug: post.slug || '',
        content: post.content || '',
        excerpt: post.excerpt || '',
        featuredImage: post.featuredImage || '',
        status: post.status || 'draft',
        tags: Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags || ''),
        authorName: post.authorName || '',
        categoryId: post.categoryId || '',
      });
    }
  }, [post]);

  const handleSubmit = async (data: BlogPostForm) => {
    if (!user || !post) return;
    setIsSaving(true);
    try {
      const token = auth?.currentUser ? await auth.currentUser.getIdToken() : '';
      // Resolve target via ?firestoreId= when present; body.slug is the fallback key server-side.
      let url = '/api/blog';
      if (post.firestoreId) url += `?firestoreId=${encodeURIComponent(post.firestoreId)}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...data, slug: post.slug }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Save failed');

      try { sessionStorage.removeItem(`blog-edit-${slug}`); } catch {}
      toast({ title: 'Article saved' });
      router.push('/admin/blog');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Save failed', description: error?.message });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );

  if (!post)
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <AlertCircle className="h-8 w-8 text-destructive opacity-30" />
        <h2 className="text-lg md:text-xl font-semibold">Article not found</h2>
        <Button asChild variant="outline" className="h-8 rounded-lg text-xs"><Link href="/admin/blog">Back to Blog</Link></Button>
      </div>
    );

  return (
    <div className="space-y-6 pb-20 min-w-0 max-w-full">
      <header className="flex items-center gap-3 min-w-0">
        <Button variant="outline" size="icon" asChild className="h-9 w-9 rounded-lg shrink-0 bg-background">
          <Link href="/admin/blog"><ChevronLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-semibold truncate">Edit Article</h1>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 font-mono truncate">{slug}</p>
        </div>
      </header>

      <BlogEditor
        form={form}
        onFormChange={setForm}
        categories={(categories as any[]) || []}
        onSubmit={handleSubmit}
        isSaving={isSaving}
        editMode
      />
    </div>
  );
}
