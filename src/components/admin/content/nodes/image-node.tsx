"use client";

import { useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import { NodeChrome } from "./node-chrome";
import { ImageUploadDialog } from "@/components/admin/content/image-upload-dialog";

const INPUT_CLASS =
  "w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-2 py-1 text-xs focus:outline-none focus:border-indigo-500";
const BUTTON_CLASS =
  "px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors";

type ImageAttrs = { assetId: string | null; alt: string; caption?: string };

function ImageNodeView({ name, label, props }: { name: "image" | "patternImage"; label: string; props: ReactNodeViewProps }) {
  const { node, updateAttributes, deleteNode, getPos, editor } = props;
  const attrs = node.attrs as ImageAttrs;
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <NodeChrome label={label} editor={editor} getPos={getPos} onDelete={deleteNode}>
      {attrs.assetId ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of a pre-generated media variant */}
          <img src={`/api/media/${attrs.assetId}/480`} alt="" className="max-h-48 rounded-lg object-contain bg-gray-800" />
          <input
            value={attrs.alt}
            onChange={(e) => updateAttributes({ alt: e.target.value })}
            placeholder="Alt (обов'язково для публікації)"
            className={INPUT_CLASS}
          />
          <input
            value={attrs.caption ?? ""}
            onChange={(e) => updateAttributes({ caption: e.target.value || undefined })}
            placeholder="Підпис (необов'язково)"
            className={INPUT_CLASS}
          />
          <button type="button" className={BUTTON_CLASS} onClick={() => setDialogOpen(true)}>
            Змінити {name === "patternImage" ? "схему" : "зображення"}
          </button>
        </div>
      ) : (
        <button type="button" className={BUTTON_CLASS} onClick={() => setDialogOpen(true)}>
          Вибрати {name === "patternImage" ? "схему" : "зображення"}
        </button>
      )}

      <ImageUploadDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelect={(ids) => {
          const first = ids[0];
          if (first) updateAttributes({ assetId: first });
        }}
      />
    </NodeChrome>
  );
}

function createImageLikeNode(name: "image" | "patternImage", label: string) {
  return Node.create({
    name,
    group: "block",
    atom: true,
    draggable: true,
    selectable: true,

    addAttributes() {
      return {
        assetId: { default: null },
        alt: { default: "" },
        caption: { default: null }
      };
    },

    parseHTML() {
      return [{ tag: `div[data-type="${name}"]` }];
    },

    renderHTML({ HTMLAttributes }) {
      return ["div", mergeAttributes(HTMLAttributes, { "data-type": name })];
    },

    addNodeView() {
      return ReactNodeViewRenderer((props: ReactNodeViewProps) => (
        <ImageNodeView name={name} label={label} props={props} />
      ));
    }
  });
}

export const ImageNode = createImageLikeNode("image", "Зображення");
export const PatternImageNode = createImageLikeNode("patternImage", "Схема (зображення)");
