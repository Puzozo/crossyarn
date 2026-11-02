"use client";

import { useEffect, useState } from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import { Blockquote } from "@tiptap/extension-blockquote";
import { ListItem } from "@tiptap/extension-list";
import { ImageNode, PatternImageNode } from "./nodes/image-node";
import { GalleryNode } from "./nodes/gallery-node";
import { StepNode } from "./nodes/step-node";
import { PatternEmbedNode } from "./nodes/pattern-embed-node";
import { VideoNode } from "./nodes/video-node";
import { ImageUploadDialog } from "./image-upload-dialog";
import { PatternPickerDialog } from "./pattern-picker-dialog";
import { parseYouTubeId } from "@/lib/content/youtube";

const HREF_PATTERN = /^https?:\/\//;
function isAllowedHref(href: string): boolean {
  return HREF_PATTERN.test(href) || (href.startsWith("/") && !href.startsWith("//"));
}

/**
 * ProseMirror attrs need a real default (`null`), but src/lib/content/schema.ts's
 * optional media fields (image/gallery-item/video `caption`/`title`) are `.optional()`
 * without `.nullable()` — they must be ABSENT, not `null`, or the whole autosave 422s.
 * Strips those null-valued keys from editor.getJSON() before it leaves the component.
 */
function dropNullOptionalAttrs(json: unknown): unknown {
  if (Array.isArray(json)) return json.map(dropNullOptionalAttrs);
  if (json === null || typeof json !== "object") return json;
  const node = json as Record<string, unknown>;
  const result: Record<string, unknown> = { ...node };
  if (typeof node.type === "string" && node.attrs && typeof node.attrs === "object") {
    const attrs = { ...(node.attrs as Record<string, unknown>) };
    if ((node.type === "image" || node.type === "patternImage" || node.type === "video") && attrs.caption === null) {
      delete attrs.caption;
    }
    if (node.type === "video" && attrs.title === null) {
      delete attrs.title;
    }
    if (node.type === "gallery" && Array.isArray(attrs.items)) {
      attrs.items = (attrs.items as Record<string, unknown>[]).map((item) => {
        if (item && item.caption === null) {
          const rest = { ...item };
          delete rest.caption;
          return rest;
        }
        return item;
      });
    }
    result.attrs = attrs;
  }
  if (Array.isArray(node.content)) {
    result.content = dropNullOptionalAttrs(node.content);
  }
  return result;
}

const TOOLBAR_BUTTON =
  "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-gray-300 hover:bg-gray-700 data-[active=true]:bg-indigo-600 data-[active=true]:text-white";
const MENU_BUTTON = "block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700";

type BlockType = "image" | "patternImage" | "gallery" | "step" | "patternEmbed" | "video";

const BLOCK_MENU_ITEMS: { type: BlockType; label: string }[] = [
  { type: "image", label: "Зображення" },
  { type: "gallery", label: "Галерея" },
  { type: "step", label: "Крок" },
  { type: "patternEmbed", label: "Схема Crossyarn" },
  { type: "patternImage", label: "Зображення схеми" },
  { type: "video", label: "YouTube" }
];

type Props = { value: string; onChange: (json: unknown) => void };

export function BlockEditor({ value, onChange }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingBlock, setPendingBlock] = useState<BlockType | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoError, setVideoError] = useState<string | null>(null);

  let initialContent: JSONContent = { type: "doc", content: [] };
  try {
    initialContent = JSON.parse(value) as JSONContent;
  } catch {
    // keep empty doc fallback
  }

  const editor = useEditor({
    immediatelyRender: false,
    content: initialContent,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        // Replaced below with versions whose `content` matches src/lib/content/schema.ts.
        blockquote: false,
        listItem: false,
        link: {
          openOnClick: false,
          autolink: false,
          linkOnPaste: false,
          validate: isAllowedHref
        }
      }),
      // schema.ts blockquoteSchema only allows paragraph+ (no nested headings/lists).
      Blockquote.extend({ content: "paragraph+" }),
      // schema.ts listItemSchema only allows paragraph|bulletList|orderedList (no headings/blockquote).
      ListItem.extend({ content: "(paragraph|bulletList|orderedList)+" }),
      ImageNode,
      PatternImageNode,
      GalleryNode,
      StepNode,
      PatternEmbedNode,
      VideoNode
    ],
    onUpdate: ({ editor }) => onChange(dropNullOptionalAttrs(editor.getJSON()))
  });

  // Keep the editor in sync if the parent resets `value` (e.g. after a version restore).
  useEffect(() => {
    if (!editor) return;
    const current = JSON.stringify(dropNullOptionalAttrs(editor.getJSON()));
    if (current === value) return;
    try {
      const parsed = JSON.parse(value);
      editor.commands.setContent(parsed, { emitUpdate: false });
    } catch {
      // ignore malformed external value
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // A selected atom block (e.g. the first block right after load) would be REPLACED by
  // insertContent; insert after it instead so adding a block never deletes one.
  const insertBlock = (content: JSONContent) => {
    if (!editor) return;
    const { selection } = editor.state;
    if (selection instanceof NodeSelection) {
      editor.chain().focus().insertContentAt(selection.to, content).run();
    } else {
      editor.chain().focus().insertContent(content).run();
    }
  };

  const insertLink = () => {
    if (!editor) return;
    const href = window.prompt("URL (https:// або /шлях)");
    if (href == null) return;
    const trimmed = href.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!isAllowedHref(trimmed)) {
      alert("Посилання має бути https:// або відносним шляхом");
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  };

  const handleBlockPick = (type: BlockType) => {
    setMenuOpen(false);
    if (!editor) return;
    if (type === "step") {
      insertBlock({ type: "step", attrs: { title: "Крок" }, content: [{ type: "paragraph" }] });
      return;
    }
    if (type === "video") {
      setVideoUrl("");
      setVideoError(null);
    }
    // image/patternImage/gallery/patternEmbed all need a value gathered from a dialog
    // BEFORE insertion — never insert a placeholder node, or the next autosave's
    // validateContentDoc (src/lib/content/repo-shared.ts) 422s the whole save.
    setPendingBlock(type);
  };

  // Resolved before insertion so an invalid/empty videoId is never committed to the doc.
  const insertVideo = () => {
    const id = parseYouTubeId(videoUrl.trim());
    if (!id) {
      setVideoError("Вставте посилання на YouTube-відео");
      return;
    }
    insertBlock({ type: "video", attrs: { provider: "youtube", videoId: id, title: undefined } });
    setPendingBlock(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-gray-800 bg-gray-900 p-1.5">
        <button
          type="button"
          data-active={editor?.isActive("heading", { level: 2 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={TOOLBAR_BUTTON}
        >
          H2
        </button>
        <button
          type="button"
          data-active={editor?.isActive("heading", { level: 3 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          className={TOOLBAR_BUTTON}
        >
          H3
        </button>
        <button
          type="button"
          data-active={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={TOOLBAR_BUTTON + " font-bold"}
        >
          B
        </button>
        <button
          type="button"
          data-active={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={TOOLBAR_BUTTON + " italic"}
        >
          I
        </button>
        <button
          type="button"
          data-active={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={TOOLBAR_BUTTON}
        >
          • Список
        </button>
        <button
          type="button"
          data-active={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={TOOLBAR_BUTTON}
        >
          1. Список
        </button>
        <button
          type="button"
          data-active={editor?.isActive("blockquote")}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          className={TOOLBAR_BUTTON}
        >
          Цитата
        </button>
        <button type="button" data-active={editor?.isActive("link")} onClick={insertLink} className={TOOLBAR_BUTTON}>
          Посилання
        </button>

        <div className="relative ml-auto">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
          >
            + Блок
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-gray-700 bg-gray-800 py-1 shadow-xl">
              {BLOCK_MENU_ITEMS.map((item) => (
                <button key={item.type} type="button" className={MENU_BUTTON} onClick={() => handleBlockPick(item.type)}>
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {editor ? (
        <EditorContent editor={editor} className="blog-prose min-h-[200px] rounded-lg border border-gray-800 bg-gray-950 p-4" />
      ) : (
        <div className="min-h-[200px] rounded-lg border border-gray-800 bg-gray-950 p-4 text-sm text-gray-500">Завантаження…</div>
      )}

      {pendingBlock === "video" && (
        <div className="space-y-2 rounded-lg border border-gray-700 bg-gray-900 p-3">
          <div className="flex gap-2">
            <input
              autoFocus
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  insertVideo();
                }
                if (e.key === "Escape") setPendingBlock(null);
              }}
              placeholder="https://www.youtube.com/watch?v=..."
              aria-label="Посилання на YouTube-відео"
              aria-invalid={videoError ? true : undefined}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
            <button type="button" onClick={insertVideo} className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500">
              Додати
            </button>
            <button type="button" onClick={() => setPendingBlock(null)} className="rounded-lg bg-gray-800 px-3 py-1 text-xs font-medium text-gray-300 hover:bg-gray-700">
              Скасувати
            </button>
          </div>
          {videoError && <p className="text-xs text-red-400">{videoError}</p>}
        </div>
      )}

      {(pendingBlock === "image" || pendingBlock === "patternImage") && (
        <ImageUploadDialog
          open
          onClose={() => setPendingBlock(null)}
          onSelect={(ids) => {
            const first = ids[0];
            if (first && editor) {
              insertBlock({ type: pendingBlock, attrs: { assetId: first, alt: "", caption: undefined } });
            }
            setPendingBlock(null);
          }}
        />
      )}

      {pendingBlock === "gallery" && (
        <ImageUploadDialog
          open
          onClose={() => setPendingBlock(null)}
          onSelect={(ids) => {
            if (ids.length > 0 && editor) {
              insertBlock({
                type: "gallery",
                attrs: { items: ids.slice(0, 12).map((assetId) => ({ assetId, alt: "", caption: undefined })) }
              });
            }
            setPendingBlock(null);
          }}
        />
      )}

      {pendingBlock === "patternEmbed" && (
        <PatternPickerDialog
          open
          onClose={() => setPendingBlock(null)}
          onSelect={(p) => {
            insertBlock({ type: "patternEmbed", attrs: { patternId: p.id } });
            setPendingBlock(null);
          }}
        />
      )}
    </div>
  );
}
