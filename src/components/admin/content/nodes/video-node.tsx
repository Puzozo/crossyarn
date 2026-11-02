"use client";

import { useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import { NodeChrome } from "./node-chrome";
import { parseYouTubeId } from "@/lib/content/youtube";

const INPUT_CLASS =
  "w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-2 py-1 text-xs focus:outline-none focus:border-indigo-500";
const BUTTON_CLASS =
  "px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors";

type VideoAttrs = { provider: "youtube"; videoId: string | null; title?: string };

function VideoNodeView(props: ReactNodeViewProps) {
  const { node, updateAttributes, deleteNode, getPos, editor } = props;
  const attrs = node.attrs as VideoAttrs;
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingUrl, setEditingUrl] = useState(!attrs.videoId);

  const applyUrl = () => {
    const id = parseYouTubeId(urlInput.trim());
    if (!id) {
      setError("Вставте посилання на YouTube-відео");
      return;
    }
    // Never commit an invalid/empty videoId to the node — src/lib/content/schema.ts
    // requires a valid 11-char id on every save, or the whole autosave 422s.
    updateAttributes({ videoId: id });
    setError(null);
    setUrlInput("");
    setEditingUrl(false);
  };

  return (
    <NodeChrome label="YouTube" editor={editor} getPos={getPos} onDelete={deleteNode}>
      {attrs.videoId && !editingUrl ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail CDN, not a local media variant */}
          <img
            src={`https://i.ytimg.com/vi/${attrs.videoId}/hqdefault.jpg`}
            alt=""
            className="max-h-48 rounded-lg object-contain bg-gray-800"
          />
          <input
            value={attrs.title ?? ""}
            onChange={(e) => updateAttributes({ title: e.target.value || undefined })}
            placeholder="Назва відео (необов'язково)"
            className={INPUT_CLASS}
          />
          <button type="button" className={BUTTON_CLASS} onClick={() => setEditingUrl(true)}>
            Змінити посилання
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className={INPUT_CLASS}
          />
          <div className="flex items-center gap-2">
            <button type="button" className={BUTTON_CLASS} onClick={applyUrl}>
              Застосувати
            </button>
            {attrs.videoId && (
              <button type="button" className={BUTTON_CLASS} onClick={() => setEditingUrl(false)}>
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

export const VideoNode = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      provider: { default: "youtube" },
      videoId: { default: null },
      title: { default: null }
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="video"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "video" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeView);
  }
});
