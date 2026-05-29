'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

import { 
  Bold, Italic, Underline as UnderlineIcon,
  List, Link as LinkIcon,
  Undo, Redo, Table as TableIcon, Image as ImageIcon,
  AlignCenter, Type, Sparkles,
  CheckSquare, Eraser, ChevronDown,
  AlertTriangle, CheckCircle2, HelpCircle, Layout
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { useCallback, useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const Toolbar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const insertBlock = (type: 'feature' | 'warning' | 'success' | 'faq') => {
    const templates = {
      feature: '<div class="product-block block-feature"><h3>✨ Key Feature</h3><p>Describe your standout feature here...</p></div>',
      warning: '<div class="product-block block-warning"><h3>⚠️ Important Note</h3><p>Highlight warnings or critical constraints here...</p></div>',
      success: '<div class="product-block block-success"><h3>✅ What\'s Included</h3><ul><li>Primary File (WebP/ZIP)</li><li>Documentation PDF</li><li>Bonus Assets</li></ul></div>',
      faq: '<div class="product-block block-faq"><h3>❓ Frequently Asked Question</h3><p><strong>Q: How do I use this?</strong><br>A: Simply follow the installation guide included in the download.</p></div>'
    };
    editor.chain().focus().insertContent(templates[type]).run();
  };

  return (
    <div className="shrink-0 z-30 w-full bg-background border-b border-white/10 sticky top-0">
      <div className="flex items-center gap-1 p-1.5 overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-0.5 px-1 border-r border-white/5">
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <Undo className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-0.5 px-1 border-r border-white/5">
          <Button type="button" variant="ghost" size="sm" className={cn("h-8 w-8 p-0", editor.isActive('bold') && "bg-primary/20 text-primary")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className={cn("h-8 w-8 p-0", editor.isActive('italic') && "bg-primary/20 text-primary")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className={cn("h-8 w-8 p-0", editor.isActive('underline') && "bg-primary/20 text-primary")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className={cn("h-8 w-8 p-0", editor.isActive('highlight') && "bg-yellow-500/20 text-yellow-500")} onClick={() => editor.chain().focus().toggleHighlight().run()}>
            <Type className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-0.5 px-1 border-r border-white/5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 gap-2 px-2 text-xs font-bold">
                Style <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-card border-white/10">
              <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>Paragraph</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className="text-xl font-bold">Heading 1</DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="text-lg font-bold">Heading 2</DropdownMenuItem>
              <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className="text-base font-bold">Heading 3</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-0.5 px-1 border-r border-white/5">
          <Button type="button" variant="ghost" size="sm" className={cn("h-8 w-8 p-0", editor.isActive('bulletList') && "bg-primary/20 text-primary")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className={cn("h-8 w-8 p-0", editor.isActive('taskList') && "bg-primary/20 text-primary")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
            <CheckSquare className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: 'center' }) && "bg-primary/20 text-primary")} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
            <AlignCenter className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-0.5 px-1 border-r border-white/5">
          <Button type="button" variant="ghost" size="sm" className={cn("h-8 w-8 p-0", editor.isActive('link') && "bg-primary/20 text-primary")} onClick={setLink}>
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={addImage}>
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={insertTable}>
            <TableIcon className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-0.5 px-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="secondary" size="sm" className="h-8 gap-2 px-3 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20">
                <Sparkles className="h-3 w-3" />
                Templates
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-white/10">
              <DropdownMenuItem onClick={() => insertBlock('feature')} className="gap-2">
                <Layout className="h-4 w-4 text-primary" /> Feature Block
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertBlock('success')} className="gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Success Block
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertBlock('faq')} className="gap-2">
                <HelpCircle className="h-4 w-4 text-accent" /> FAQ Block
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => insertBlock('warning')} className="gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Warning Block
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5" />
              <DropdownMenuItem onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} className="gap-2 text-destructive">
                <Eraser className="h-4 w-4" /> Clear Formatting
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export function RichTextEditor({ content, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start documenting your asset...',
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-xl border border-white/5 shadow-lg mx-auto my-4',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose-content focus:outline-none min-h-[400px] p-8 bg-white/50 dark:bg-black/20',
          className
        ),
      },
    },
    immediatelyRender: false
  });

  // Handle external content updates (crucial for initial load and AI generation)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // Only set content if the editor is NOT focused to prevent cursor jumping
      // or if it's the initial empty state.
      if (!editor.isFocused || editor.isEmpty) {
        editor.commands.setContent(content, false);
      }
    }
  }, [content, editor]);

  return (
    <div className="flex flex-col w-full rounded-2xl border border-white/10 bg-card/20 overflow-hidden shadow-sm min-h-[500px]">
      <Toolbar editor={editor} />
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <EditorContent editor={editor} />
      </div>
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-t border-white/5 text-[9px] text-muted-foreground uppercase tracking-widest font-black bg-black/5">
        <div className="flex items-center gap-4">
          <span>Words: {editor?.storage.characterCount?.words?.() || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-green-500" />
          <span>Editor Active</span>
        </div>
      </div>
    </div>
  );
}