"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { Editor } from "@tiptap/react";

export function topLevelIndex(editor: Editor, pos: number | undefined): number {
  if (pos === undefined) return -1;
  return editor.state.doc.resolve(pos).index(0);
}

export function topLevelCount(editor: Editor): number {
  return editor.state.doc.childCount;
}

/**
 * Swaps this top-level node with its previous/next sibling. All 6 custom nodes
 * (image/patternImage/gallery/step/patternEmbed/video) are direct children of doc,
 * so `index(0)` is their position among siblings.
 *
 * Implemented as ONE `replaceWith` over the combined [start, end) range of both
 * siblings, not as a delete-then-insert pair: positions passed to a transaction's
 * second step must be valid in the document produced by the first step, and get
 * this wrong (as an earlier version of this function did) silently corrupts the
 * doc — observed in testing as unrelated sibling nodes disappearing entirely.
 */
export function moveTopLevelNode(editor: Editor, getPos: () => number | undefined, dir: -1 | 1): void {
  const pos = getPos();
  if (pos === undefined) return;
  const $pos = editor.state.doc.resolve(pos);
  const index = $pos.index(0);
  const parent = $pos.parent;
  const targetIndex = index + dir;
  if (targetIndex < 0 || targetIndex >= parent.childCount) return;
  const thisNode = parent.child(index);
  const otherNode = parent.child(targetIndex);
  const thisStart = pos;
  const rangeStart = dir === -1 ? thisStart - otherNode.nodeSize : thisStart;
  const rangeEnd = dir === -1 ? thisStart + thisNode.nodeSize : thisStart + thisNode.nodeSize + otherNode.nodeSize;
  const swapped = dir === -1 ? [thisNode, otherNode] : [otherNode, thisNode];
  const tr = editor.state.tr.replaceWith(rangeStart, rangeEnd, swapped);
  editor.view.dispatch(tr);
}

type Props = {
  label: string;
  editor: Editor;
  getPos: () => number | undefined;
  onDelete: () => void;
  children: React.ReactNode;
};

export function NodeChrome({ label, editor, getPos, onDelete, children }: Props) {
  const index = topLevelIndex(editor, getPos());
  const count = topLevelCount(editor);
  return (
    <NodeViewWrapper className="my-3 rounded-lg border border-gray-700 bg-gray-900/40 p-3" data-drag-handle>
      <div className="mb-2 flex items-center justify-between select-none" contentEditable={false}>
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</span>
        <div className="flex gap-2 text-sm">
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
          <button type="button" onClick={onDelete} aria-label="Видалити блок" className="text-red-400 hover:text-red-300">
            ×
          </button>
        </div>
      </div>
      {children}
    </NodeViewWrapper>
  );
}
