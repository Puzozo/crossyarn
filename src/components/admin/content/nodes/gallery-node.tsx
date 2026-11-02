"use client";

import { useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import { NodeChrome } from "./node-chrome";
import { ImageUploadDialog } from "@/components/admin/content/image-upload-dialog";

const INPUT_CLASS =
  "w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-2 py-1 text-xs focus:outline-none focus:border-indigo-500";
const BUTTON_CLASS =
  "px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors disabled:opacity-50";

const MAX_ITEMS = 12;

type GalleryItem = { assetId: string; alt: string; caption?: string };

function GalleryNodeView(props: ReactNodeViewProps) {
  const { node, updateAttributes, deleteNode, getPos, editor } = props;
  const items = (node.attrs.items ?? []) as GalleryItem[];
  const [dialogOpen, setDialogOpen] = useState(false);

  const updateItem = (index: number, patch: Partial<GalleryItem>) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    updateAttributes({ items: next });
  };

  const removeItem = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    // The gallery node requires >=1 item (src/lib/content/schema.ts gallerySchema); an empty
    // gallery can't be saved, so drop the whole block instead of leaving it invalid.
    if (next.length === 0) {
      deleteNode();
      return;
    }
    updateAttributes({ items: next });
  };

  return (
    <NodeChrome label="Галерея" editor={editor} getPos={getPos} onDelete={deleteNode}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((item, i) => (
          <div key={item.assetId + i} className="space-y-1 rounded-lg border border-gray-800 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of a pre-generated media variant */}
            <img src={`/api/media/${item.assetId}/480`} alt="" className="h-20 w-full rounded object-cover bg-gray-800" />
            <input
              value={item.alt}
              onChange={(e) => updateItem(i, { alt: e.target.value })}
              placeholder="Alt (обов'язково)"
              className={INPUT_CLASS}
            />
            <input
              value={item.caption ?? ""}
              onChange={(e) => updateItem(i, { caption: e.target.value || undefined })}
              placeholder="Підпис"
              className={INPUT_CLASS}
            />
            <button type="button" onClick={() => removeItem(i)} className="text-xs text-red-400 hover:text-red-300">
              Видалити
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className={BUTTON_CLASS + " mt-2"}
        disabled={items.length >= MAX_ITEMS}
        onClick={() => setDialogOpen(true)}
      >
        + Додати фото
      </button>

      <ImageUploadDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelect={(ids) => {
          const room = MAX_ITEMS - items.length;
          const toAdd = ids.slice(0, room).map((assetId) => ({ assetId, alt: "", caption: undefined }));
          if (toAdd.length === 0) return;
          updateAttributes({ items: [...items, ...toAdd] });
        }}
      />
    </NodeChrome>
  );
}

export const GalleryNode = Node.create({
  name: "gallery",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return { items: { default: [] } };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="gallery"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "gallery" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GalleryNodeView);
  }
});
