"use client";
/**
 * ItemNote — evrak başına kısa kişisel not (TipTap).
 * Not yalnızca bu tarayıcıda saklanır. Öğrenci adı vb. kişisel veri yazılmaması önerilir.
 */
import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, List } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ItemNote({ storageKey }: { storageKey: string }) {
  const initial = React.useMemo(() => {
    try { return localStorage.getItem(storageKey) ?? ""; } catch { return ""; }
  }, [storageKey]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false, blockquote: false }),
      Placeholder.configure({ placeholder: "Örn. Müdür onayı için 12 Eylül'de idareye bırakılacak." }),
    ],
    content: initial,
    editorProps: {
      attributes: {
        class: "min-h-16 px-3 py-2 text-[13px] leading-5 text-es-ink-900 focus:outline-none [&_ul]:list-disc [&_ul]:pl-5",
        "aria-label": "Evrak notu",
      },
    },
    onUpdate: ({ editor }) => {
      try { localStorage.setItem(storageKey, editor.getHTML()); } catch { /* yok say */ }
    },
  });

  if (!editor) return null;

  const btn = (active: boolean) =>
    cn("grid size-8 place-items-center rounded-md text-es-ink-600 hover:bg-es-line", active && "bg-es-turquoise-100 text-es-navy-900");

  return (
    <div className="ml-10 overflow-hidden rounded-xl border border-es-line bg-white focus-within:border-es-royal-600 focus-within:shadow-es-focus">
      <div className="flex gap-1 border-b border-es-line bg-es-surface-50 p-1">
        <button type="button" aria-label="Kalın" aria-pressed={editor.isActive("bold")} className={btn(editor.isActive("bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="size-4" aria-hidden />
        </button>
        <button type="button" aria-label="Madde listesi" aria-pressed={editor.isActive("bulletList")} className={btn(editor.isActive("bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="size-4" aria-hidden />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
