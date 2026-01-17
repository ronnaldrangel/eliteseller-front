import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { Bold, Italic, Strikethrough, List, ListOrdered } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex gap-1 border-b p-2 bg-muted/20">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={cn(
          "p-2 rounded hover:bg-muted transition-colors",
          editor.isActive("bold") ? "bg-muted text-foreground" : "text-muted-foreground"
        )}
        title="Negrita"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={cn(
          "p-2 rounded hover:bg-muted transition-colors",
          editor.isActive("italic") ? "bg-muted text-foreground" : "text-muted-foreground"
        )}
        title="Cursiva"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={cn(
          "p-2 rounded hover:bg-muted transition-colors",
          editor.isActive("strike") ? "bg-muted text-foreground" : "text-muted-foreground"
        )}
        title="Tachado"
      >
        <Strikethrough className="w-4 h-4" />
      </button>
      {/* <div className="w-px bg-border mx-1 my-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          "p-2 rounded hover:bg-muted transition-colors",
          editor.isActive("bulletList") ? "bg-muted text-foreground" : "text-muted-foreground"
        )}
        title="Lista"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          "p-2 rounded hover:bg-muted transition-colors",
          editor.isActive("orderedList") ? "bg-muted text-foreground" : "text-muted-foreground"
        )}
        title="Lista numerada"
      >
        <ListOrdered className="w-4 h-4" />
      </button> */}
    </div>
  );
};

export default function RichTextEditor({ value, onChange, placeholder, className, minRows = 3, disabled = false }) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none p-3 min-h-[80px]",
          disabled && "opacity-50 cursor-not-allowed",
          className
        ),
      },
    },
    onUpdate: ({ editor }) => {
      // Get markdown output
      const markdown = editor.storage.markdown.getMarkdown();
      onChange && onChange(markdown);
    },
  });

  // Sync value changes if external
  useEffect(() => {
    if (editor && value !== undefined) {
      const currentMarkdown = editor.storage.markdown.getMarkdown();
      // Only update if content is different to avoid cursor jumps
      if (currentMarkdown !== value && value !== currentMarkdown + '\n') {
         editor.commands.setContent(value);
      }
    }
  }, [value, editor]);

  // Sync disabled state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("rounded-md border border-input bg-transparent shadow-sm focus-within:ring-1 focus-within:ring-ring", disabled && "bg-muted/50")}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="" />
    </div>
  );
}
