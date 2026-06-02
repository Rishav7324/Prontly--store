'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import CharacterCount from '@tiptap/extension-character-count';

import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Link as LinkIcon, 
  RotateCcw,
  RotateCw,
  Plus,
  Highlighter,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  List,
  ListOrdered,
  CheckSquare,
  Table as TableIcon,
  Minus,
  RemoveFormatting,
  Columns,
  Rows,
  Trash2,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  Sparkles,
  Zap,
  Terminal,
  Layers,
  ChevronDown,
  Wand2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

// --- Sub-component: Toolbar ---
interface EditorToolbarProps {
  editor: Editor;
  onOpenBlockMenu: () => void;
}

function EditorToolbar({ editor, onOpenBlockMenu }: EditorToolbarProps) {
  const isTableActive = editor.isActive('table');

  const ToolbarButton = ({ 
    onClick, 
    isActive, 
    children, 
    title,
    disabled = false,
    className
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    children: React.ReactNode;
    title: string;
    disabled?: boolean;
    className?: string;
  }) => (
    <Button
      variant="ghost"
      size="icon"
      disabled={disabled}
      className={cn(
        "h-9 w-9 rounded-lg transition-all duration-200 shrink-0",
        isActive 
          ? "bg-primary text-white shadow-lg shadow-primary/20" 
          : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50",
        className
      )}
      onClick={(e) => { e.preventDefault(); onClick(); }}
      title={title}
    >
      {children}
    </Button>
  );

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="flex items-center w-full h-14 bg-white/90 backdrop-blur-xl border-b border-slate-100">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2 px-2 md:px-4 w-full">
        <div className="flex items-center gap-1 pr-2 border-r border-slate-100">
          <ToolbarButton onClick={onOpenBlockMenu} title="Insert Element" className="bg-slate-900 text-white hover:bg-slate-800">
            <Plus className="w-5 h-5" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-slate-100">
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
            <RotateCcw className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
            <RotateCw className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-slate-100">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline">
            <UnderlineIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-slate-100">
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="H1">
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="H2">
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Quote">
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="Code">
            <Terminal className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2 border-r border-slate-100">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullets">
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbers">
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={addLink} isActive={editor.isActive('link')} title="Link">
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1 px-2">
          <ToolbarButton onClick={addImage} title="Image">
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} 
            isActive={isTableActive} 
            title="Table"
          >
            <TableIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Clear Formatting">
            <RemoveFormatting className="w-4 h-4" />
          </ToolbarButton>
        </div>
      </div>
    </div>
  );
}

// --- Sub-component: Block Sheet ---
interface BlockInsertionSheetProps {
  editor: Editor;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function BlockInsertionSheet({ editor, isOpen, onOpenChange }: BlockInsertionSheetProps) {
  const blocks = [
    {
      group: "Typography",
      items: [
        { label: "Text", icon: <Type className="w-5 h-5" />, action: () => editor.chain().focus().setParagraph().run(), desc: "Plain body text." },
        { label: "Heading 1", icon: <Heading1 className="w-5 h-5" />, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), desc: "Main headline." },
        { label: "Heading 2", icon: <Heading2 className="w-5 h-5" />, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), desc: "Section title." },
        { label: "Quote", icon: <Quote className="w-5 h-5" />, action: () => editor.chain().focus().toggleBlockquote().run(), desc: "Testimonial block." },
      ]
    },
    {
      group: "Technical",
      items: [
        { label: "Table", icon: <TableIcon className="w-5 h-5" />, action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run(), desc: "Grid data." },
        { label: "Code Block", icon: <Terminal className="w-5 h-5" />, action: () => editor.chain().focus().toggleCodeBlock().run(), desc: "Formatted code." },
        { label: "Divider", icon: <Minus className="w-5 h-5" />, action: () => editor.chain().focus().setHorizontalRule().run(), desc: "Visual break." },
        { label: "YouTube", icon: <YoutubeIcon className="w-5 h-5" />, action: () => {
          const url = window.prompt('YouTube URL');
          if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
        }, desc: "Video embed." },
      ]
    }
  ];

  const handleBlockAction = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 bg-white border-l border-slate-100 shadow-2xl">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-8 border-b border-slate-50 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-xl text-white shadow-lg shadow-primary/20">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <SheetTitle className="text-xl font-headline font-bold">Element Library</SheetTitle>
                <SheetDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Content Infrastructure</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
            {blocks.map((group, idx) => (
              <div key={idx} className="space-y-4">
                <h4 className="text-[9px] font-black text-slate-300 uppercase tracking-[0.25em] px-2">{group.group}</h4>
                <div className="grid grid-cols-1 gap-2">
                  {group.items.map((item, itemIdx) => (
                    <button 
                      key={itemIdx}
                      onClick={() => handleBlockAction(item.action)}
                      className="group flex items-center gap-4 p-4 rounded-2xl border border-transparent bg-slate-50/50 hover:bg-white hover:border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all text-left"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:border-primary transition-all shadow-sm">
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm">{item.label}</p>
                        <p className="text-[11px] text-slate-400 truncate">{item.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-8 border-t border-slate-50 bg-slate-50/30">
             <div className="p-5 bg-midnight-ink rounded-[1.5rem] text-white space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 transition-transform">
                   <Wand2 className="w-16 h-16" />
                </div>
                <div className="flex items-center gap-2 relative z-10">
                   <Sparkles className="w-3.5 h-3.5 text-accent fill-accent" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-accent">Workflow Shortcut</span>
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed font-medium relative z-10">
                  Type <code className="text-white bg-white/10 px-1 rounded">/</code> anywhere to quickly toggle the block selection terminal.
                </p>
             </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// --- Main Component: RichTextEditor ---
interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ content, onChange, placeholder, className }: RichTextEditorProps) {
  const [isBlockMenuOpen, setIsBlockMenuOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { HTMLAttributes: { class: 'bg-slate-900 text-slate-100 p-6 rounded-2xl font-mono text-sm overflow-x-auto my-8 border border-white/5' } },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline font-bold cursor-pointer underline-offset-4 decoration-primary/30' },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Begin drafting your high-performance content...',
      }),
      Subscript,
      Superscript,
      Highlight.configure({ multicolor: true }),
      TaskList.configure({ HTMLAttributes: { class: 'tiptap-tasks space-y-3 my-6' } }),
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true, HTMLAttributes: { class: 'border-collapse table-fixed w-full my-8 border border-slate-200 rounded-xl overflow-hidden' } }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({ HTMLAttributes: { class: 'rounded-[2rem] border border-slate-100 shadow-2xl max-w-full h-auto mx-auto my-12' } }),
      Youtube.configure({ width: 800, height: 450, HTMLAttributes: { class: 'rounded-[2rem] overflow-hidden shadow-2xl my-12 aspect-video w-full' } }),
      CharacterCount,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose-content focus:outline-none min-h-[500px] px-2 md:px-24 py-6 md:py-24 text-base leading-relaxed selection:bg-primary/10 transition-all',
          className
        ),
      },
    },
    immediatelyRender: false
  });

  useEffect(() => {
    if (!editor) return;
    const timeout = setTimeout(() => {
      const currentHTML = editor.getHTML();
      if (content !== currentHTML && !editor.isFocused) {
        editor.commands.setContent(content, false);
      }
    }, 50);
    return () => clearTimeout(timeout);
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="relative flex flex-col h-[700px] w-full bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
      <div className="sticky top-0 z-30 shrink-0">
        <EditorToolbar editor={editor} onOpenBlockMenu={() => setIsBlockMenuOpen(true)} />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        <EditorContent editor={editor} />
      </div>

      <BlockInsertionSheet 
        editor={editor} 
        isOpen={isBlockMenuOpen} 
        onOpenChange={setIsBlockMenuOpen} 
      />

      <div className="h-10 bg-slate-50 border-t border-slate-100 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-4 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
           <span>Words: {editor.storage.characterCount?.words?.() || 0}</span>
           <span className="h-1 w-1 rounded-full bg-slate-200" />
           <span>Estimate: {Math.ceil((editor.storage.characterCount?.words?.() || 0) / 225)} min read</span>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Workspace</span>
        </div>
      </div>
    </div>
  );
}