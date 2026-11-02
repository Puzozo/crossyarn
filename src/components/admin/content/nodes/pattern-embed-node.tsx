"use client";

import { useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import { NodeChrome } from "./node-chrome";
import { PatternPickerDialog } from "@/components/admin/content/pattern-picker-dialog";

const BUTTON_CLASS =
  "px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors";

function PatternEmbedNodeView(props: ReactNodeViewProps) {
  const { node, updateAttributes, deleteNode, getPos, editor } = props;
  const patternId = node.attrs.patternId as string | null;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState<string | null>(null);

  return (
    <NodeChrome label="Схема Crossyarn" editor={editor} getPos={getPos} onDelete={deleteNode}>
      {patternId ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of the pattern thumbnail endpoint */}
          <img
            src={`/api/patterns/${patternId}/thumbnail`}
            alt=""
            className="h-16 w-16 rounded-lg bg-gray-800 object-contain"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-white">{title ?? patternId}</p>
            <button type="button" className={BUTTON_CLASS + " mt-1"} onClick={() => setDialogOpen(true)}>
              Змінити
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className={BUTTON_CLASS} onClick={() => setDialogOpen(true)}>
          Вибрати схему
        </button>
      )}

      <PatternPickerDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelect={(p) => {
          updateAttributes({ patternId: p.id });
          setTitle(p.title);
        }}
      />
    </NodeChrome>
  );
}

export const PatternEmbedNode = Node.create({
  name: "patternEmbed",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return { patternId: { default: null } };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="patternEmbed"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "patternEmbed" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PatternEmbedNodeView);
  }
});
