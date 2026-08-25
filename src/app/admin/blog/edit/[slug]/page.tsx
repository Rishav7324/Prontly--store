'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, limit, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ChevronLeft, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { BlogEditor, type BlogPostForm } from '@/components/admin/BlogEditor';

export default function EditBlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);

  const postQuery = useMemoFirebase(() => {
    return db ? query(collection(db, 'blog_posts'), where('slug', '==', slug), limit(1)) : null;
  }, [db, slug]);

  const { data: posts, loading } = useCollection(postQuery);
  const post = posts?.[0] as any;
  const { data: categories } = useCollection(db ? collection(db, 'categories') : null);

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
        tags: post.tags?.join(', ') || '',
        authorName: post.authorName || '',
        categoryId: post.categoryId || '',
      });
    }
  }, [post]);

  const handleSubmit = async (data: BlogPostForm) => {
    if (!db || !post) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'blog_posts', post.id), {
        ...data,
        tags: data.tags.split(',').map((t) => t.trim()).filter(Boolean),
        updatedAt: serverTimestamp(),
      });
      toast({ title: 'Article saved' });
      router.push('/admin/blog');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Save failed' });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  if (loading)
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
