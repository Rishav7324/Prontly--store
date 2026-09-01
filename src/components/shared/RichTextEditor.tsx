'use client';

import { useState, useEffect } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExt from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import ImageExt from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import TextAlign from '@tiptap/extension-text-align';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Link as LinkIcon,
  Undo2,
  Redo2,
  Highlighter,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  ListTodo,
  Table as TableIcon,
  Minus,
  RemoveFormatting,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  Play,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Clock,
  Eye,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { uploadFileDirectlyToR2 } from '@/lib/upload/direct-upload';
import { optimizeImage } from '@/lib/image-optimizer';
import { cn } from '@/lib/utils';

/* ── Toolbar button ─────────────────────────────────────── */
function TBtn({
  active,
  onClick,
  title,
  disabled = false,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-md transition-colors',
        active ? 'bg-accent text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}

const Divider = () => <span className="mx-0.5 h-5 w-px shrink-0 bg-border" />;

/* ── Props ──────────────────────────────────────────────── */
interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  /** slug used for R2 image upload path */
  uploadSlug?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Write product description…',
  className,
  uploadSlug,
}: RichTextEditorProps) {
  const [previewMode, setPreviewMode] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Subscript,
      Superscript,
      Highlight.configure({ multicolor: true }),
      LinkExt.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
      ImageExt,
      Youtube.configure({ width: 640, height: 360 }),
    ],
    content: content || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn('prose-content min-h-[280px] px-4 py-3 focus:outline-none', className),
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  /* Sync external content changes */
  useEffect(() => {
    if (!editor) return;
    const t = setTimeout(() => {
      const cur = editor.getHTML();
      if (content !== cur && !editor.isFocused) {
        editor.commands.setContent(content || '', false);
      }
    }, 50);
    return () => clearTimeout(t);
  }, [content, editor]);

  if (!editor) return null;

  /* ── helpers ── */
  const chain = () => editor.chain().focus();

  async function uploadAndInsert() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const optimized = await optimizeImage(file);
        const slugPart = (uploadSlug || `img-${Date.now()}`).replace(/[^a-z0-9-]/gi, '-');
        const f = new File([optimized.blob], `${slugPart}-${Date.now()}.webp`, { type: 'image/webp' });
        const key = `products/desc/${slugPart}/${f.name}`;
        
        const res = await uploadFileDirectlyToR2({
          file: f,
          key,
        });

        if (!res.success || !res.url) throw new Error(res.error || 'Failed to upload');
        chain().setImage({ src: res.url }).run();
        toast({ title: 'Image inserted', description: 'Embedded into editor.' });
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Upload failed', description: error.message || 'Could not upload image.' });
      }
    };
    input.click();
  }

  function addLink() {
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('Link URL', prev);
    if (url === null) return;
    if (url === '') { chain().extendMarkRange('link').unsetLink().run(); return; }
    const sel = editor.state.selection;
    if (sel && !sel.empty) chain().extendMarkRange('link').setLink({ href: url }).run();
    else chain().insertContent(`<a href="${url.replace(/"/g, '')}">${url}</a>`).run();
  }

  const words = editor.storage.characterCount?.words?.() ?? stripCount(editor.getHTML());

  /* ── toolbar groups ── */
  const fmt = (
    <>
      <TBtn active={editor.isActive('bold')} onClick={() => chain().toggleBold().run()} title="Bold"><Bold className="size-3.5" /></TBtn>
      <TBtn active={editor.isActive('italic')} onClick={() => chain().toggleItalic().run()} title="Italic"><Italic className="size-3.5" /></TBtn>
      <TBtn active={editor.isActive('underline')} onClick={() => chain().toggleUnderline().run()} title="Underline"><UnderlineIcon className="size-3.5" /></TBtn>
      <TBtn active={editor.isActive('strike')} onClick={() => chain().toggleStrike().run()} title="Strikethrough"><Strikethrough className="size-3.5" /></TBtn>
      <TBtn active={editor.isActive('highlight')} onClick={() => chain().toggleHighlight().run()} title="Highlight"><Highlighter className="size-3.5" /></TBtn>
      <TBtn active={editor.isActive('code')} onClick={() => chain().toggleCode().run()} title="Inline code"><Code className="size-3.5" /></TBtn>
    </>
  );

  const headings = (
    <>
      <TBtn active={editor.isActive('heading', { level: 2 })} onClick={() => chain().toggleHeading({ level: 2 }).run()} title="Heading"><Heading2 className="size-3.5" /></TBtn>
      <TBtn active={editor.isActive('heading', { level: 3 })} onClick={() => chain().toggleHeading({ level: 3 }).run()} title="Subheading"><Heading3 className="size-3.5" /></TBtn>
      <TBtn active={editor.isActive('blockquote')} onClick={() => chain().toggleBlockquote().run()} title="Quote"><Quote className="size-3.5" /></TBtn>
      <TBtn active={editor.isActive('codeBlock')} onClick={() => chain().toggleCodeBlock().run()} title="Code block"><Code className="size-3.5" /></TBtn>
    </>
  );

  const lists = (
    <>
      <TBtn active={editor.isActive('bulletList')} onClick={() => chain().toggleBulletList().run()} title="Bullets"><List className="size-3.5" /></TBtn>
      <TBtn active={editor.isActive('orderedList')} onClick={() => chain().toggleOrderedList().run()} title="Numbered"><ListOrdered className="size-3.5" /></TBtn>
      <TBtn active={editor.isActive('taskList')} onClick={() => chain().toggleTaskList().run()} title="Checklist"><ListTodo className="size-3.5" /></TBtn>
    </>
  );

  const align = (
    <>
      <TBtn active={editor.isActive({ textAlign: 'left' })} onClick={() => chain().setTextAlign('left').run()} title="Left"><AlignLeft className="size-3.5" /></TBtn>
      <TBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => chain().setTextAlign('center').run()} title="Center"><AlignCenter className="size-3.5" /></TBtn>
      <TBtn active={editor.isActive({ textAlign: 'right' })} onClick={() => chain().setTextAlign('right').run()} title="Right"><AlignRight className="size-3.5" /></TBtn>
    </>
  );

  const insert = (
    <>
      <TBtn onClick={uploadAndInsert} title="Upload image"><Upload className="size-3.5" /></TBtn>
      <TBtn
        onClick={() => { const u = window.prompt('Image URL'); if (u) chain().setImage({ src: u }).run(); }}
        title="Image URL"
      ><ImageIcon className="size-3.5" /></TBtn>
      <TBtn
        onClick={() => { const u = window.prompt('YouTube URL'); if (u) chain().setYoutubeVideo({ src: u }).run(); }}
        title="YouTube"
      ><YoutubeIcon className="size-3.5" /></TBtn>
      <TBtn onClick={addLink} active={editor.isActive('link')} title="Link"><LinkIcon className="size-3.5" /></TBtn>
      <TBtn
        onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        active={editor.isActive('table')}
        title="Table"
      ><TableIcon className="size-3.5" /></TBtn>
      <TBtn onClick={() => chain().setHorizontalRule().run()} title="Divider"><Minus className="size-3.5" /></TBtn>
    </>
  );

  const history = (
    <>
      <TBtn disabled={!editor.can().undo()} onClick={() => chain().undo().run()} title="Undo"><Undo2 className="size-3.5" /></TBtn>
      <TBtn disabled={!editor.can().redo()} onClick={() => chain().redo().run()} title="Redo"><Redo2 className="size-3.5" /></TBtn>
      <TBtn onClick={() => chain().unsetAllMarks().clearNodes().run()} title="Clear formatting"><RemoveFormatting className="size-3.5" /></TBtn>
    </>
  );

  /* ── render ── */
  return (
    <div className="min-w-0 max-w-full">
      {/* mode toggle */}
      <div className="mb-2 flex items-center gap-1">
        {(['edit', 'preview'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setPreviewMode(m === 'preview')}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              previewMode === (m === 'preview') ? 'bg-accent text-white' : 'text-muted-foreground hover:bg-muted'
            )}
          >
            {m === 'edit' ? <Type className="mr-1 inline size-3" /> : <Eye className="mr-1 inline size-3" />}
            {m === 'edit' ? 'Edit' : 'Preview'}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        {!previewMode && (
          <div className="flex flex-wrap items-center gap-0.5 overflow-x-auto border-b border-border p-1.5 no-scrollbar">
            {fmt}<Divider />{headings}<Divider />{lists}<Divider />{align}<Divider />
            {insert}<Divider />{history}
          </div>
        )}

        {previewMode ? (
          <div className="prose-content min-h-[280px] max-h-[420px] overflow-auto px-4 py-3 custom-scrollbar"
            dangerouslySetInnerHTML={{ __html: content || '<p class="text-muted-foreground italic">Nothing to preview.</p>' }} />
        ) : (
          <EditorContent editor={editor} />
        )}

        <div className="flex items-center gap-3 border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
          <span>{words} words</span>
          <span className="inline-flex items-center gap-1"><Clock className="size-3" />{Math.max(1, Math.ceil(words / 200))} min</span>
          <span className="ml-auto">{content?.length || 0} chars</span>
        </div>
      </div>

      <p className="mt-1.5 text-[10px] text-muted-foreground">
        Tip: use <strong>H2/H3</strong> headings, checklists and tables — they render on the product page.
      </p>
    </div>
  );
}

function stripCount(html: string): number {
  return html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
}
