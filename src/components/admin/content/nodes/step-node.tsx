"use client";

import { useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewContent, NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { ImageUploadDialog } from "@/components/admin/content/image-upload-dialog";
import { moveTopLevelNode, topLevelCount, topLevelIndex } from "./node-chrome";

const INPUT_CLASS =
  "w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-2 py-1 text-sm font-medium focus:outline-none focus:border-indigo-500";
const BUTTON_CLASS =
  "px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors";

function StepNodeView(props: ReactNodeViewProps) {
  const { node, updateAttributes, deleteNode, getPos, editor } = props;
  // Controlled locally: stepSchema.attrs.title requires min(1), so attrs must never be
  // committed as an empty string mid-typing (that would 422 the whole doc on autosave).
  const [title, setTitle] = useState<string>(node.attrs.title ?? "Крок");
  const [dialogOpen, setDialogOpen] = useState(false);

  const index = topLevelIndex(editor, getPos());
  const count = topLevelCount(editor);

  const commitTitle = () => {
    const trimmed = title.trim();
    if (trimmed) {
      updateAttributes({ title: trimmed });
    } else {
      setTitle(node.attrs.title || "Крок");
    }
  };

  const insertImageAtEnd = (assetId: string) => {
    const pos = getPos();
    if (pos === undefined) return;
    const endPos = pos + node.nodeSize - 1;
    editor.chain().focus().insertContentAt(endPos, { type: "image", attrs: { assetId, alt: "", caption: undefined } }).run();
  };

  return (
    <NodeViewWrapper className="my-3 rounded-lg border border-gray-700 bg-gray-900/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2" contentEditable={false}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          className={INPUT_CLASS}
          placeholder="Назва кроку"
        />
        <div className="flex items-center gap-2 text-sm shrink-0">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => moveTopLevelNode(editor, getPos, -1)}
            aria-label="Вище"
            className="text-gray-500 hover:text-white disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={index === count - 1}
            onClick={() => moveTopLevelNode(editor, getPos, 1)}
            aria-label="Нижче"
            className="text-gray-500 hover:text-white disabled:opacity-30"
          >
            ↓
          </button>
          <button type="button" onClick={deleteNode} aria-label="Видалити блок" className="text-red-400 hover:text-red-300">
            ×
          </button>
        </div>
      </div>

      <NodeViewContent className="step-content rounded-lg border border-gray-800 p-2 text-sm text-gray-200" />

      <div contentEditable={false} className="mt-2">
        <button type="button" className={BUTTON_CLASS} onClick={() => setDialogOpen(true)}>
          + Зображення
        </button>
      </div>

      <ImageUploadDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelect={(ids) => {
          const first = ids[0];
          if (first) insertImageAtEnd(first);
        }}
      />
    </NodeViewWrapper>
  );
}

export const StepNode = Node.create({
  name: "step",
  group: "block",
  // src/lib/content/schema.ts stepContentSchema: only paragraph|bulletList|orderedList|image
  // (no patternImage) are allowed inside a step.
  content: "(paragraph|bulletList|orderedList|image)+",
  defining: true,
  isolating: true,

  addAttributes() {
    return { title: { default: "Крок" } };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="step"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "step" }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(StepNodeView);
  }
});
