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
  ChevronDown
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
        "h-10 w-10 md:h-11 md:w-11 min-w-[40px] md:min-w-[44px] rounded-xl transition-all duration-200 shrink-0",
        isActive 
          ? "bg-primary/10 text-primary shadow-sm border border-primary/10" 
          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
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
    <div className="flex items-center w-full h-14 md:h-16 overflow-hidden bg-white/80 backdrop-blur-md">
      <div className="flex items-center gap-0.5 md:gap-1 overflow-x-auto no-scrollbar py-2 px-2 md:px-4 scroll-smooth touch-pan-x w-full max-w-full flex-nowrap shrink-0">
        <div className="flex items-center shrink-0">
          <ToolbarButton onClick={onOpenBlockMenu} title="Add Block" className="bg-slate-50 border border-slate-100">
            <Plus className="w-5 h-5" />
          </ToolbarButton>
          <Separator orientation="vertical" className="h-6 mx-2 bg-slate-100 shrink-0" />
          <div className="flex items-center gap-0.5 shrink-0">
            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
              <RotateCcw className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
              <RotateCw className="w-4 h-4" />
            </ToolbarButton>
          </div>
        </div>

        <Separator orientation="vertical" className="h-8 mx-2 bg-slate-100 shrink-0" />

        <div className="flex items-center gap-0.5 shrink-0">
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
          <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} title="Highlight">
            <Highlighter className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Inline Code">
            <Code className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={addLink} isActive={editor.isActive('link')} title="Link">
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <Separator orientation="vertical" className="h-8 mx-2 bg-slate-100 shrink-0" />

        <div className="flex items-center gap-0.5 shrink-0">
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1">
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2">
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3">
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Blockquote">
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
            <Minus className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="Code Block">
            <Terminal className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <Separator orientation="vertical" className="h-8 mx-2 bg-slate-100 shrink-0" />

        <div className="flex items-center gap-0.5 shrink-0">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List">
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Ordered List">
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} title="Task List">
            <CheckSquare className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <Separator orientation="vertical" className="h-8 mx-2 bg-slate-100 shrink-0" />

        <div className="flex items-center gap-0.5 shrink-0">
          <ToolbarButton onClick={addImage} title="Image URL">
            <ImageIcon className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => {
            const url = window.prompt('YouTube URL');
            if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
          }} title="YouTube Embed">
            <YoutubeIcon className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <Separator orientation="vertical" className="h-8 mx-2 bg-slate-100 shrink-0" />

        <div className="flex items-center gap-0.5 shrink-0 pr-4">
          <ToolbarButton 
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} 
            isActive={isTableActive} 
            title="Insert Table"
          >
            <TableIcon className="w-4 h-4" />
          </ToolbarButton>
          {isTableActive && (
            <>
              <ToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column">
                <Columns className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row">
                <Rows className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table">
                <Trash2 className="w-4 h-4 text-rose-500" />
              </ToolbarButton>
            </>
          )}
          <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} title="Reset Format">
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
      group: "Basics",
      items: [
        { label: "Text", icon: <Type className="w-5 h-5" />, action: () => editor.chain().focus().setParagraph().run(), desc: "Start with plain text." },
        { label: "Heading 1", icon: <Heading1 className="w-5 h-5" />, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), desc: "Big section heading." },
        { label: "Heading 2", icon: <Heading2 className="w-5 h-5" />, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), desc: "Medium section heading." },
        { label: "Heading 3", icon: <Heading3 className="w-5 h-5" />, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), desc: "Small section heading." },
      ]
    },
    {
      group: "Organization",
      items: [
        { label: "Bullet List", icon: <List className="w-5 h-5" />, action: () => editor.chain().focus().toggleBulletList().run(), desc: "Simple bulleted list." },
        { label: "Numbered List", icon: <ListOrdered className="w-5 h-5" />, action: () => editor.chain().focus().toggleOrderedList().run(), desc: "List with numbering." },
        { label: "Task List", icon: <CheckSquare className="w-5 h-5" />, action: () => editor.chain().focus().toggleTaskList().run(), desc: "Track tasks with checkboxes." },
        { label: "Quote", icon: <Quote className="w-5 h-5" />, action: () => editor.chain().focus().toggleBlockquote().run(), desc: "Capture a testimonial or quote." },
        { label: "Divider", icon: <Minus className="w-5 h-5" />, action: () => editor.chain().focus().setHorizontalRule().run(), desc: "Visually separate sections." },
      ]
    },
    {
      group: "Advanced Content",
      items: [
        { label: "Table", icon: <TableIcon className="w-5 h-5" />, action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run(), desc: "Add a structured data table." },
        { label: "Code Block", icon: <Terminal className="w-5 h-5" />, action: () => editor.chain().focus().toggleCodeBlock().run(), desc: "Share code snippets." },
        { label: "YouTube", icon: <YoutubeIcon className="w-5 h-5" />, action: () => {
          const url = window.prompt('YouTube URL');
          if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
        }, desc: "Embed a video directly." },
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
          <SheetHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Plus className="w-5 h-5" />
              </div>
              <SheetTitle className="text-xl font-headline font-bold">Insert Block</SheetTitle>
            </div>
            <SheetDescription className="text-slate-400 font-medium text-xs uppercase tracking-widest">
              Editorial Node Library
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="space-y-12">
              {blocks.map((group, idx) => (
                <div key={idx} className="space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.25em] px-1">{group.group}</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {group.items.map((item, itemIdx) => (
                      <button 
                        key={itemIdx}
                        onClick={() => handleBlockAction(item.action)}
                        className="group flex items-center gap-5 p-4 rounded-2xl border border-slate-50 bg-white hover:bg-slate-50 hover:border-slate-100 transition-all text-left shadow-sm hover:shadow-md"
                      >
                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all shadow-inner border border-slate-100 group-hover:border-primary">
                          {item.icon}
                        </div>
                        <div className="space-y-1 min-w-0">
                          <p className="font-bold text-slate-900 text-sm group-hover:text-primary transition-colors">{item.label}</p>
                          <p className="text-xs text-slate-400 truncate pr-4">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 border-t border-slate-50 bg-slate-50/20">
             <div className="p-5 bg-slate-900 rounded-[1.5rem] text-white space-y-3 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                   <Zap className="w-16 h-16 text-primary" />
                </div>
                <div className="flex items-center gap-2 relative z-10">
                   <Sparkles className="w-3.5 h-3.5 text-primary fill-primary" />
                   <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Pro Tip</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium relative z-10">
                  Use Markdown shortcuts like <code className="text-white bg-white/10 px-1 rounded">#</code> for H1 and <code className="text-white bg-white/10 px-1 rounded">*</code> for bullet lists.
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
        codeBlock: { HTMLAttributes: { class: 'bg-slate-900 text-slate-100 p-4 md:p-6 rounded-xl font-mono text-xs md:text-sm overflow-x-auto mb-6 whitespace-pre break-words' } },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline font-bold cursor-pointer decoration-primary/30 underline-offset-4' },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Begin your editorial protocol...',
      }),
      Subscript,
      Superscript,
      Highlight.configure({ multicolor: true }),
      TaskList.configure({ HTMLAttributes: { class: 'tiptap-tasks space-y-2' } }),
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true, HTMLAttributes: { class: 'border-collapse table-fixed w-full mb-8 border border-slate-200' } }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({ HTMLAttributes: { class: 'rounded-2xl md:rounded-3xl shadow-lg border border-slate-100 max-w-full h-auto mx-auto my-8' } }),
      Youtube.configure({ width: 800, height: 450, HTMLAttributes: { class: 'rounded-xl md:rounded-2xl overflow-hidden shadow-xl mb-8 aspect-video w-full' } }),
      CharacterCount,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose-content focus:outline-none min-h-[400px] px-4 md:px-20 py-8 md:py-16 text-base leading-relaxed selection:bg-primary/10 break-words overflow-x-hidden whitespace-pre-wrap',
          className
        ),
      },
    },
    immediatelyRender: false
  });

  // Debounced synchronization to handle AI generation and initial loads without jumping
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
    <div className="relative flex flex-col h-[calc(100dvh-200px)] md:h-[600px] w-full max-w-full bg-white rounded-2xl md:rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden group box-border">
      {/* 1. FIXED STICKY TOOLBAR */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-50 w-full overflow-hidden shrink-0">
        <EditorToolbar editor={editor} onOpenBlockMenu={() => setIsBlockMenuOpen(true)} />
      </div>

      {/* 2. SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-white w-full max-w-full">
        <div className="w-full max-w-full overflow-x-hidden">
          <EditorContent editor={editor} className="w-full max-w-full overflow-x-hidden" />
        </div>
      </div>

      {/* 3. BLOCK INSERTION DRAWER */}
      <BlockInsertionSheet 
        editor={editor} 
        isOpen={isBlockMenuOpen} 
        onOpenChange={setIsBlockMenuOpen} 
      />

      {/* 4. FOOTER STATUS */}
      <div className="h-8 md:h-10 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between px-4 md:px-8 shrink-0">
        <div className="flex items-center gap-3 md:gap-4 text-[8px] md:text-[9px] font-bold text-slate-300 uppercase tracking-widest">
           <span>Words: {editor.storage.characterCount?.words?.() || 0}</span>
           <span className="hidden xs:inline">Reading Time: {Math.ceil((editor.storage.characterCount?.words?.() || 0) / 200)} min</span>
        </div>
        <div className="flex items-center gap-1">
           <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[8px] md:text-[9px] font-bold text-slate-300 uppercase tracking-widest">Live Sync Active</span>
        </div>
      </div>
    </div>
  );
}
