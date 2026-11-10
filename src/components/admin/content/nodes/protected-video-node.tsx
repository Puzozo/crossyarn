"use client";

import { useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import { NodeChrome } from "./node-chrome";

export const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const INPUT_CLASS =
  "w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-2 py-1 text-xs focus:outline-none focus:border-indigo-500";
const BUTTON_CLASS =
  "px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors";

type ProtectedVideoAttrs = { provider: "bunny"; videoId: string | null; title?: string };

function ProtectedVideoNodeView(props: ReactNodeViewProps) {
  const { node, updateAttributes, deleteNode, getPos, editor } = props;
  const attrs = node.attrs as ProtectedVideoAttrs;
  const [guidInput, setGuidInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingGuid, setEditingGuid] = useState(!attrs.videoId);

  const applyGuid = () => {
    const trimmed = guidInput.trim();
    if (!GUID_RE.test(trimmed)) {
      setError("Невалідний GUID відео (формат: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)");
      return;
    }
    // Never commit an invalid/empty videoId to the node — src/lib/content/schema.ts
    // requires a valid Bunny GUID on every save, or the whole autosave 422s.
    updateAttributes({ videoId: trimmed });
    setError(null);
    setGuidInput("");
    setEditingGuid(false);
  };

  return (
    <NodeChrome label="Bunny" editor={editor} getPos={getPos} onDelete={deleteNode}>
      {attrs.videoId && !editingGuid ? (
        <div className="space-y-2">
          <code className="text-xs text-gray-400 break-all">{attrs.videoId}</code>
          <input
            value={attrs.title ?? ""}
            onChange={(e) => updateAttributes({ title: e.target.value || undefined })}
            placeholder="Назва відео (необов'язково)"
            className={INPUT_CLASS}
          />
          <button type="button" className={BUTTON_CLASS} onClick={() => setEditingGuid(true)}>
            Змінити GUID
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            value={guidInput}
            onChange={(e) => setGuidInput(e.target.value)}
            placeholder="GUID відео з бібліотеки Bunny Stream"
            className={INPUT_CLASS}
          />
          <div className="flex items-center gap-2">
            <button type="button" className={BUTTON_CLASS} onClick={applyGuid}>
              Застосувати
            </button>
            {attrs.videoId && (
              <button type="button" className={BUTTON_CLASS} onClick={() => setEditingGuid(false)}>
                Скасувати
              </button>
            )}
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}
    </NodeChrome>
  );
}

export const ProtectedVideoNode = Node.create({
  name: "protectedVideo",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      provider: { default: "bunny" },
      videoId: { default: null },
      title: { default: null }
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="protectedVideo"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "protectedVideo" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ProtectedVideoNodeView);
  }
});