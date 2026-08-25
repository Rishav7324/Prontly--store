'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import ImageExt from '@tiptap/extension-image';
import LinkExt from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Youtube from '@tiptap/extension-youtube';
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Table as TableIcon,
  Undo2,
  Underline as UnderlineIcon,
  Play,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
  Type,
  Clock,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { uploadFileAction } from '@/app/actions/r2-actions';
import { optimizeImage } from '@/lib/image-optimizer';
import { cn, generateSlug } from '@/lib/utils';

export interface BlogPostForm {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  status: string;
  tags: string;
  authorName: string;
  categoryId: string;
}

interface BlogEditorProps {
  form: BlogPostForm;
  onFormChange: (form: BlogPostForm) => void;
  categories: any[];
  onSubmit: (form: BlogPostForm) => Promise<void>;
  isSaving?: boolean;
  editMode?: boolean;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function readTime(html: string): string {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

export function BlogEditor({
  form,
  onFormChange,
  categories,
  onSubmit,
  isSaving = false,
  editMode = false,
}: BlogEditorProps) {
  const router = useRouter();
  const [tab, setTab] = useState<'content' | 'config'>('content');
  const set = <K extends keyof BlogPostForm>(key: K, value: BlogPostForm[K]) =>
    onFormChange({ ...form, [key]: value });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Highlight,
      Underline,
      Subscript,
      Superscript,
      ImageExt,
      LinkExt.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Start writing your post…' }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      Youtube.configure({ width: 640, height: 360 }),
    ],
    content: form.content || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose-content max-w-none min-h-[320px] px-4 md:px-6 py-4 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => onFormChange({ ...form, content: editor.getHTML() }),
  });

  useEffect(() => {
    if (!editor) return;
    const timeout = setTimeout(() => {
      const currentHTML = editor.getHTML();
      if (form.content !== currentHTML && !editor.isFocused) {
        editor.commands.setContent(form.content || '', false);
      }
    }, 50);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.content]);

  const plainText = stripHtml(form.content);
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const charCount = plainText.length;

  async function save(): Promise<void> {
    if (!form.title.trim()) return void toast({ variant: 'destructive', title: 'Title required' });
    if (!form.slug.trim()) return void toast({ variant: 'destructive', title: 'Slug required' });
    await onSubmit(form);
  }

  async function uploadImage(): Promise<string | null> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    const url = await new Promise<string | null>((resolve) => {
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return resolve(null);
        try {
          const optimized = await optimizeImage(file);
          const slugPart = form.slug || generateSlug(form.title) || `post-${Date.now()}`;
          const f = new File([optimized.blob], `${slugPart}-${Date.now()}.webp`, { type: 'image/webp' });
          const key = `blog/content/${slugPart}/${f.name}`;
          const fd = new FormData();
          fd.append('file', f);
          fd.append('key', key);
          const r = await uploadFileAction(fd);
          resolve(r.success ? r.url! : null);
        } catch {
          resolve(null);
        }
      };
      input.click();
    });
    return url;
  }

  async function insertImage() {
    const url = await uploadImage();
    if (!url) return toast({ variant: 'destructive', title: 'Upload failed' });
    const src = window.prompt('Image URL (leave as uploaded)', url);
    if (!src) return;
    editor?.chain().focus().setImage({ src }).run();
  }

  function setFeaturedImage() {
    void (async () => {
      const url = await uploadImage();
      if (url) set('featuredImage', url);
    })();
  }

  const toolbarBtn = (
    active: boolean,
    onClick: () => void,
    label: string,
    children: React.ReactNode
  ) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={label}
      className={cn(
        'flex size-7 items-center justify-center rounded-md transition-colors shrink-0',
        active ? 'bg-primary text-white' : 'text-slate-500 hover:bg-muted'
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="min-w-0">
      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-stone-gray/10 bg-card p-1 shadow-sm mb-4">
        {(
          [
            ['content', 'Content'],
            ['config', 'Config'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'flex-1 rounded-lg px-3 py-2 text-xs md:text-sm font-medium transition-colors',
              tab === key ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'content' ? (
        <>
          {/* Title */}
          <Input
            value={form.title}
            onChange={(e) => {
              const title = e.target.value;
              onFormChange({
                ...form,
                title,
                slug: !form.slug || form.slug === generateSlug(form.title) ? generateSlug(title) : form.slug,
              });
            }}
            placeholder="Post title…"
            className="mb-3 h-11 bg-background rounded-xl text-base md:text-lg font-bold border-stone-gray/10"
          />
          <p className="mb-4 text-[10px] text-muted-foreground font-mono">store.prontly.in/blog/{form.slug || '…'}</p>

          {/* Editor + Preview grid */}
          <div className="grid items-start gap-4 min-w-0 xl:grid-cols-2">
            <div className="flex h-[60vh] md:h-[70vh] min-h-[360px] min-w-0 flex-col rounded-2xl border border-stone-gray/10 bg-card shadow-sm overflow-hidden">
              <div className="flex flex-wrap items-center gap-0.5 border-b border-stone-gray/10 p-2 overflow-x-auto no-scrollbar max-w-full">
                {toolbarBtn(editor?.isActive('bold') ?? false, () => editor?.chain().focus().toggleBold().run(), 'Bold', <Bold className="size-3.5" />)}
                {toolbarBtn(editor?.isActive('italic') ?? false, () => editor?.chain().focus().toggleItalic().run(), 'Italic', <Italic className="size-3.5" />)}
                {toolbarBtn(editor?.isActive('underline') ?? false, () => editor?.chain().focus().toggleUnderline().run(), 'Underline', <UnderlineIcon className="size-3.5" />)}
                {toolbarBtn(editor?.isActive('strike') ?? false, () => editor?.chain().focus().toggleStrike().run(), 'Strikethrough', <Strikethrough className="size-3.5" />)}
                {toolbarBtn(editor?.isActive('heading', { level: 2 }) ?? false, () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), 'H2', <Heading2 className="size-3.5" />)}
                {toolbarBtn(editor?.isActive('heading', { level: 3 }) ?? false, () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), 'H3', <Heading3 className="size-3.5" />)}
                {toolbarBtn(editor?.isActive('bulletList') ?? false, () => editor?.chain().focus().toggleBulletList().run(), 'Bullet list', <List className="size-3.5" />)}
                {toolbarBtn(editor?.isActive('orderedList') ?? false, () => editor?.chain().focus().toggleOrderedList().run(), 'Numbered list', <ListOrdered className="size-3.5" />)}
                {toolbarBtn(editor?.isActive('taskList') ?? false, () => editor?.chain().focus().toggleTaskList().run(), 'Task list', <ListTodo className="size-3.5" />)}
                {toolbarBtn(editor?.isActive('blockquote') ?? false, () => editor?.chain().focus().toggleBlockquote().run(), 'Quote', <Quote className="size-3.5" />)}
                {toolbarBtn(editor?.isActive('codeBlock') ?? false, () => editor?.chain().focus().toggleCodeBlock().run(), 'Code block', <Code className="size-3.5" />)}
                {toolbarBtn(editor?.isActive('highlight') ?? false, () => editor?.chain().focus().toggleHighlight().run(), 'Highlight', <Highlighter className="size-3.5" />)}
                {toolbarBtn(editor?.isActive('subscript') ?? false, () => editor?.chain().focus().toggleSubscript().run(), 'Subscript', <SubscriptIcon className="size-3.5" />)}
                {toolbarBtn(editor?.isActive('superscript') ?? false, () => editor?.chain().focus().toggleSuperscript().run(), 'Superscript', <SuperscriptIcon className="size-3.5" />)}
                {toolbarBtn(editor?.isActive('table') ?? false, () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), 'Table', <TableIcon className="size-3.5" />)}
                <span className="mx-1 h-5 w-px bg-border shrink-0" />
                {toolbarBtn(false, () => editor?.chain().focus().setTextAlign('left').run(), 'Align left', <AlignLeft className="size-3.5" />)}
                {toolbarBtn(false, () => editor?.chain().focus().setTextAlign('center').run(), 'Align center', <AlignCenter className="size-3.5" />)}
                {toolbarBtn(false, () => editor?.chain().focus().setTextAlign('right').run(), 'Align right', <AlignRight className="size-3.5" />)}
                <span className="mx-1 h-5 w-px bg-border shrink-0" />
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { const u = window.prompt('Image URL'); if (u) editor?.chain().focus().setImage({ src: u }).run(); }} title="Image from URL" className="flex size-7 items-center justify-center rounded-md text-slate-500 hover:bg-muted shrink-0">
                  <ImageIcon className="size-3.5" />
                </button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={insertImage} title="Upload & insert image" className="flex size-7 items-center justify-center rounded-md text-slate-500 hover:bg-muted shrink-0">
                  <Upload className="size-3.5" />
                </button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { const u = window.prompt('YouTube URL'); if (u) editor?.chain().focus().setYoutubeVideo({ src: u }).run(); }} title="YouTube embed" className="flex size-7 items-center justify-center rounded-md text-slate-500 hover:bg-muted shrink-0">
                  <Play className="size-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const url = window.prompt('Link URL');
                    if (!url) return;
                    const sel = editor?.state.selection;
                    if (sel && !sel.empty) editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                    else editor?.chain().focus().insertContent(`<a href="${url.replace(/"/g, '')}">${url}</a>`).run();
                  }}
                  title="Add link"
                  className="flex size-7 items-center justify-center rounded-md text-slate-500 hover:bg-muted shrink-0"
                >
                  <LinkIcon className="size-3.5" />
                </button>
                {toolbarBtn(false, () => editor?.chain().focus().setHorizontalRule().run(), 'Divider', <Minus className="size-3.5" />)}
                {toolbarBtn(false, () => editor?.chain().focus().unsetAllMarks().clearNodes().run(), 'Clear formatting', <Code className="size-3.5" />)}
                <span className="mx-1 h-5 w-px bg-border shrink-0" />
                {toolbarBtn(false, () => editor?.chain().focus().undo().run(), 'Undo', <Undo2 className="size-3.5" />)}
                {toolbarBtn(false, () => editor?.chain().focus().redo().run(), 'Redo', <Redo2 className="size-3.5" />)}
              </div>
              <div className="min-h-0 flex-1 overflow-auto custom-scrollbar">
                <EditorContent editor={editor} />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-stone-gray/10 px-3 md:px-4 py-2 text-[10px] md:text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Type className="size-3" /> {wordCount.toLocaleString()} words</span>
                <span>{charCount.toLocaleString()} chars</span>
                <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {readTime(form.content)}</span>
                <span className="ml-auto hidden sm:inline-flex">
                  {form.status === 'published' ? <Badge className="bg-green-100 text-green-700">published</Badge> : <Badge variant="secondary">draft</Badge>}
                </span>
              </div>
            </div>

            {/* Live preview */}
            <div className="hidden min-w-0 xl:block xl:sticky xl:top-24">
              <div className="rounded-2xl border border-stone-gray/10 bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-primary inline-flex items-center gap-1.5">
                    <Eye className="size-3" /> Live preview
                  </p>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground">As readers see it</span>
                </div>
                {form.content ? (
                  <div
                    className="prose-content min-w-0 max-h-[70vh] overflow-auto custom-scrollbar"
                    dangerouslySetInnerHTML={{ __html: form.content }}
                  />
                ) : (
                  <p className="py-8 text-center text-xs text-muted-foreground italic">Nothing to preview yet — start typing.</p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {tab === 'config' ? (
        <div className="grid gap-4 lg:grid-cols-2 min-w-0">
          <div className="space-y-4 rounded-2xl border border-stone-gray/10 bg-card p-4 md:p-6 shadow-sm">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Slug</label>
              <Input
                value={form.slug}
                onChange={(e) => set('slug', generateSlug(e.target.value))}
                placeholder="my-post-slug"
                className="font-mono text-xs"
              />
              <p className="mt-1 text-[10px] text-muted-foreground">store.prontly.in/blog/{form.slug || '…'}</p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Excerpt</label>
              <Textarea
                value={form.excerpt}
                onChange={(e) => set('excerpt', e.target.value)}
                placeholder="One or two sentences shown on cards and in search results"
                rows={3}
                className="text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => set('categoryId', e.target.value)}
                className="w-full rounded-lg border border-stone-gray/20 bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Uncategorised</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tags (comma separated)</label>
              <Input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="ai, workflow, creator…" className="text-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Author override</label>
              <Input value={form.authorName} onChange={(e) => set('authorName', e.target.value)} placeholder="Prontly Editorial" className="text-sm" />
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-stone-gray/10 bg-card p-4 md:p-6 shadow-sm">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Featured image</label>
              {form.featuredImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.featuredImage} alt="Featured" className="mt-2 h-40 w-full object-cover rounded-xl border border-stone-gray/20" />
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={setFeaturedImage}>
                  <Upload className="size-3.5 mr-1" /> Upload image
                </Button>
                {form.featuredImage ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => set('featuredImage', '')}>Remove</Button>
                ) : null}
              </div>
              <Input
                value={form.featuredImage}
                onChange={(e) => set('featuredImage', e.target.value)}
                placeholder="…or paste an image URL"
                className="mt-2 font-mono text-xs"
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={form.status === 'published'}
                onChange={(e) => set('status', e.target.checked ? 'published' : 'draft')}
                className="size-4 accent-[var(--primary)]"
              />
              Published (visible on /blog)
            </label>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {form.slug ? <Badge variant="secondary">/blog/{form.slug}</Badge> : null}
              {form.tags ? <Badge variant="secondary">{form.tags.split(',').filter(Boolean).length} tags</Badge> : null}
            </div>
            <Button
              type="button"
              onClick={save}
              disabled={isSaving}
              className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01]"
            >
              {isSaving ? 'Saving…' : editMode ? 'Save changes' : 'Publish post'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
