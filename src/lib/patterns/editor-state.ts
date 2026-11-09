"use client";

import { create } from "zustand";
import { PatternDocument, PatternGrid, PatternSymbol, Rapport, RapportMark, PatternCell } from "@/lib/patterns/model";

function getSymbolWidth(symbolId: string, symbols: PatternSymbol[]): number {
  return symbols.find((s) => s.id === symbolId)?.width ?? 1;
}

function getSymbolHeight(symbolId: string, symbols: PatternSymbol[]): number {
  return symbols.find((s) => s.id === symbolId)?.height ?? 1;
}

function clearMultiCellSymbol(
  cells: PatternGrid,
  anchorRow: number,
  anchorCol: number,
  width: number,
  height: number,
  defaultColor: string
) {
  for (let r = anchorRow; r < anchorRow + height && r < cells.length; r++) {
    for (let c = anchorCol; c < anchorCol + width && c < cells[r].length; c++) {
      cells[r][c] = { symbolId: "empty", color: defaultColor };
    }
  }
}

function findAndClearOccupyingSymbol(cells: PatternGrid, symbols: PatternSymbol[], row: number, col: number, defaultColor: string) {
  const cell = cells[row][col];
  if (cell.occupiedByAnchor) {
    const [anchorRow, anchorCol] = cell.occupiedByAnchor;
    const anchorCell = cells[anchorRow]?.[anchorCol];
    if (!anchorCell) return;
    const width = getSymbolWidth(anchorCell.symbolId, symbols);
    const height = getSymbolHeight(anchorCell.symbolId, symbols);
    clearMultiCellSymbol(cells, anchorRow, anchorCol, width, height, defaultColor);
  } else {
    const width = getSymbolWidth(cell.symbolId, symbols);
    const height = getSymbolHeight(cell.symbolId, symbols);
    if (width > 1 || height > 1) {
      clearMultiCellSymbol(cells, row, col, width, height, defaultColor);
    }
  }
}

function clipRapportMarks(marks: RapportMark[] | undefined, width: number, height: number): RapportMark[] | undefined {
  if (!marks) return marks;
  return marks
    .map((m) => ({ ...m, width: Math.min(m.width, width - m.col), height: Math.min(m.height, height - m.row) }))
    .filter((m) => m.row >= 0 && m.col >= 0 && m.row < height && m.col < width && m.width > 0 && m.height > 0);
}

function shiftRapportMarks(marks: RapportMark[] | undefined, dRow: number, dCol: number): RapportMark[] | undefined {
  if (!marks) return marks;
  return marks.map((m) => ({ ...m, row: m.row + dRow, col: m.col + dCol }));
}

/**
 * Paints one symbol (with multi-cell expansion) into `pattern` at (row, column).
 * Returns false if the symbol doesn't fit within the pattern bounds.
 */
function paintOneCellInto(
  pattern: PatternDocument,
  symbols: PatternSymbol[],
  row: number,
  column: number,
  selectedSymbolId: string,
  selectedColor: string,
  defaultColor: string
): boolean {
  const width = getSymbolWidth(selectedSymbolId, symbols);
  const height = getSymbolHeight(selectedSymbolId, symbols);
  if (column + width > pattern.width || row + height > pattern.height) return false;

  for (let r = row; r < row + height; r++) {
    for (let c = column; c < column + width; c++) {
      const targetCell = pattern.cells[r][c];
      if (
        targetCell.occupiedByAnchor ||
        getSymbolWidth(targetCell.symbolId, symbols) > 1 ||
        getSymbolHeight(targetCell.symbolId, symbols) > 1
      ) {
        findAndClearOccupyingSymbol(pattern.cells, symbols, r, c, defaultColor);
      }
    }
  }

  pattern.cells[row][column] = { symbolId: selectedSymbolId, color: selectedColor };

  for (let r = row; r < row + height; r++) {
    for (let c = column; c < column + width; c++) {
      if (r === row && c === column) continue;
      pattern.cells[r][c] = { symbolId: "empty", color: selectedColor, occupiedByAnchor: [row, column] };
    }
  }

  return true;
}

function nanoid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function markId() {
  return "mark-" + nanoid();
}

export type ToastData = {
  key: string;
  params?: Record<string, string | number>;
} | null;

export type RapportMirror = "none" | "h" | "v" | "hv";

/**
 * Mirrors rapport cells horizontally and/or vertically.
 * Multi-cell symbols keep their anchor as top-left of the block:
 * the block position is mirrored, then occupied cells are regenerated.
 */
export function mirrorRapportCells(
  cells: PatternCell[][],
  width: number,
  height: number,
  mirror: RapportMirror,
  symbols: PatternSymbol[]
): PatternCell[][] {
  if (mirror === "none") return cells;
  const flipH = mirror === "h" || mirror === "hv";
  const flipV = mirror === "v" || mirror === "hv";

  const result: PatternCell[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ symbolId: "empty", color: "#f5ede1" }))
  );

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const cell = cells[r][c];
      if (cell.occupiedByAnchor) continue; // regenerated from anchors below
      const sw = getSymbolWidth(cell.symbolId, symbols);
      const sh = getSymbolHeight(cell.symbolId, symbols);
      const newR = flipV ? height - r - sh : r;
      const newC = flipH ? width - c - sw : c;
      result[newR][newC] = { symbolId: cell.symbolId, color: cell.color };
      for (let rr = newR; rr < newR + sh && rr < height; rr++) {
        for (let cc = newC; cc < newC + sw && cc < width; cc++) {
          if (rr === newR && cc === newC) continue;
          result[rr][cc] = { symbolId: "empty", color: cell.color, occupiedByAnchor: [newR, newC] };
        }
      }
    }
  }

  return result;
}

type EditorState = {
  pattern: PatternDocument | null;
  selectedSymbolId: string;
  selectedColor: string;
  history: PatternDocument[];
  future: PatternDocument[];
  toastData: ToastData;

  isSelectionMode: boolean;
  isSelecting: boolean;
  selectionStart: [number, number] | null;
  selectionEnd: [number, number] | null;

  rapportInsertId: string | null;
  rapportMirror: RapportMirror;
  zoomLevel: number;
  isFillMode: boolean;

  isPainting: boolean;
  lastPaintedCell: [number, number] | null;
  strokeSnapshot: PatternDocument | null;
  strokeTouched: Set<string>;

  setZoom: (level: number) => void;
  setRapportMirror: (mirror: RapportMirror) => void;
  setPattern: (pattern: PatternDocument) => void;
  beginStroke: () => void;
  paintCell: (row: number, column: number, options?: { inStroke?: boolean }) => void;
  endStroke: () => void;
  paintSegment: (r1: number, c1: number, r2: number, c2: number) => void;
  toggleFillMode: () => void;
  fillCells: (row: number, column: number) => void;
  setSelectedSymbolId: (symbolId: string) => void;
  setSelectedColor: (color: string) => void;
  setSymbols: (symbols: PatternDocument["symbols"]) => void;
  resizePattern: (newWidth: number, newHeight: number) => void;
  addEdge: (edge: "top" | "bottom" | "left" | "right") => void;
  removeEdge: (edge: "top" | "bottom" | "left" | "right") => void;
  toggleSkipPurlRows: () => void;
  clearToast: () => void;
  undo: () => void;
  redo: () => void;

  toggleSelectionMode: () => void;
  startSelection: (row: number, col: number) => void;
  updateSelection: (row: number, col: number) => void;
  endSelection: () => void;
  clearSelection: () => void;
  saveSelectionAsRapport: (name: string) => void;
  markSelectionAsRapport: () => void;
  removeRapportMark: (id: string) => void;
  clearRapportMarks: () => void;
  deleteRapport: (id: string) => void;

  startRapportInsert: (id: string) => void;
  cancelRapportInsert: () => void;
  insertRapport: (anchorRow: number, anchorCol: number) => void;
};

function clonePattern(pattern: PatternDocument) {
  return structuredClone(pattern);
}

export const usePatternEditorStore = create<EditorState>((set, get) => ({
  pattern: null,
  selectedSymbolId: "knit",
  selectedColor: "#d67c8f",
  history: [],
  future: [],
  toastData: null,
  isSelectionMode: false,
  isSelecting: false,
  selectionStart: null,
  selectionEnd: null,
  rapportInsertId: null,
  rapportMirror: "none",
  zoomLevel: 1,
  isFillMode: false,
  isPainting: false,
  lastPaintedCell: null,
  strokeSnapshot: null,
  strokeTouched: new Set<string>(),

  setZoom: (level) => set({ zoomLevel: Math.max(0.4, Math.min(2.5, level)) }),
  setRapportMirror: (rapportMirror) => set({ rapportMirror }),

  clearToast: () => set({ toastData: null }),

  setPattern: (pattern) =>
    set({
      pattern,
      history: [],
      future: [],
      selectedColor: pattern.palette[0]?.hex ?? "#f5ede1",
      selectedSymbolId: pattern.symbols[0]?.id ?? "empty"
    }),

  beginStroke: () => {
    const state = get();
    if (!state.pattern) return;
    set({
      strokeSnapshot: clonePattern(state.pattern),
      strokeTouched: new Set<string>(),
      isPainting: true
    });
  },

  paintCell: (row, column, options) => {
    const state = get();
    if (!state.pattern) return;

    const inStroke = options?.inStroke === true;
    const key = `${row},${column}`;
    if (inStroke && state.strokeTouched.has(key)) return;

    const next = clonePattern(state.pattern);
    const symbols = next.symbols;
    const width = getSymbolWidth(state.selectedSymbolId, symbols);
    const height = getSymbolHeight(state.selectedSymbolId, symbols);
    const defaultColor = next.palette[0]?.hex ?? "#f5ede1";

    const painted = paintOneCellInto(next, symbols, row, column, state.selectedSymbolId, state.selectedColor, defaultColor);
    if (!painted) {
      if (column + width > next.width) {
        set({ toastData: { key: "toast.notEnoughSpace", params: { needed: width, available: next.width - column } } });
      } else {
        set({ toastData: { key: "toast.notEnoughSpace", params: { needed: height, available: next.height - row } } });
      }
      return;
    }

    if (inStroke) {
      const strokeTouched = new Set(state.strokeTouched);
      for (let r = row; r < row + height; r++) {
        for (let c = column; c < column + width; c++) {
          strokeTouched.add(`${r},${c}`);
        }
      }
      // No history push mid-stroke: the whole stroke is one undo step (pushed in endStroke).
      set({ pattern: next, strokeTouched, lastPaintedCell: [row, column] });
    } else {
      const previous = clonePattern(state.pattern);
      set({ pattern: next, history: [...state.history, previous], future: [], lastPaintedCell: [row, column] });
    }
  },

  endStroke: () => {
    const state = get();
    if (!state.isPainting) return;
    if (state.strokeTouched.size > 0 && state.strokeSnapshot) {
      // One history entry for the whole stroke.
      set({
        history: [...state.history, state.strokeSnapshot],
        future: [],
        isPainting: false,
        strokeSnapshot: null,
        strokeTouched: new Set<string>()
      });
    } else {
      set({ isPainting: false, strokeSnapshot: null, strokeTouched: new Set<string>() });
    }
  },

  paintSegment: (r1, c1, r2, c2) => {
    const state = get();
    if (!state.pattern) return;
    if (r1 !== r2 && c1 !== c2) return; // only straight horizontal/vertical segments

    const previous = clonePattern(state.pattern);
    const next = clonePattern(state.pattern);
    const symbols = next.symbols;
    const width = getSymbolWidth(state.selectedSymbolId, symbols);
    const height = getSymbolHeight(state.selectedSymbolId, symbols);
    const defaultColor = next.palette[0]?.hex ?? "#f5ede1";

    // Anchor positions from (r1,c1) to (r2,c2) inclusive, stepped by the
    // selected symbol's width (horizontal) / height (vertical); the last
    // anchor always lands exactly on the endpoint.
    const positions: [number, number][] = [];
    if (r1 === r2) {
      const dir = Math.sign(c2 - c1);
      const count = Math.max(1, Math.ceil(Math.abs(c2 - c1) / width));
      for (let i = 1; i <= count; i++) {
        positions.push([r1, i === count ? c2 : c1 + dir * i * width]);
      }
    } else {
      const dir = Math.sign(r2 - r1);
      const count = Math.max(1, Math.ceil(Math.abs(r2 - r1) / height));
      for (let i = 1; i <= count; i++) {
        positions.push([i === count ? r2 : r1 + dir * i * height, c1]);
      }
    }

    for (const [r, c] of positions) {
      if (!paintOneCellInto(next, symbols, r, c, state.selectedSymbolId, state.selectedColor, defaultColor)) {
        if (c + width > next.width) {
          set({ toastData: { key: "toast.notEnoughSpace", params: { needed: width, available: next.width - c } } });
        } else {
          set({ toastData: { key: "toast.notEnoughSpace", params: { needed: height, available: next.height - r } } });
        }
        break;
      }
    }

    set({ pattern: next, history: [...state.history, previous], future: [], lastPaintedCell: [r2, c2] });
  },

  toggleFillMode: () => {
    const state = get();
    set({
      isFillMode: !state.isFillMode,
      // Fill is mutually exclusive with selection and rapport-insert modes
      isSelectionMode: false,
      isSelecting: false,
      selectionStart: null,
      selectionEnd: null,
      rapportInsertId: null
    });
  },

  fillCells: (row, column) => {
    const state = get();
    if (!state.pattern) return;
    const symbols = state.pattern.symbols;

    // Multi-cell symbols can't tile a flood region — restrict fill to 1×1.
    if (getSymbolWidth(state.selectedSymbolId, symbols) > 1 || getSymbolHeight(state.selectedSymbolId, symbols) > 1) {
      set({ toastData: { key: "toast.fillSingleCellOnly" } });
      return;
    }

    const start = state.pattern.cells[row]?.[column];
    if (!start || start.occupiedByAnchor) return;
    // Multi-cell anchors act as barriers too, not fillable seeds.
    if (getSymbolWidth(start.symbolId, symbols) > 1 || getSymbolHeight(start.symbolId, symbols) > 1) return;

    const targetSymbolId = start.symbolId;
    const targetColor = (start.color ?? "").trim().toLowerCase();
    const newColor = state.selectedColor;
    if (targetSymbolId === state.selectedSymbolId && targetColor === newColor.trim().toLowerCase()) return;

    const previous = clonePattern(state.pattern);
    const next = clonePattern(state.pattern);
    const { width, height } = next;

    // 4-connected flood fill over cells matching the clicked (symbol, color).
    const visited = new Uint8Array(width * height);
    const stack: [number, number][] = [[row, column]];
    visited[row * width + column] = 1;
    while (stack.length > 0) {
      const [r, c] = stack.pop()!;
      next.cells[r][c] = { symbolId: state.selectedSymbolId, color: newColor };
      for (const [nr, nc] of [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]] as const) {
        if (nr < 0 || nr >= height || nc < 0 || nc >= width) continue;
        if (visited[nr * width + nc]) continue;
        const cell = next.cells[nr][nc];
        if (cell.occupiedByAnchor) continue;
        if (cell.symbolId !== targetSymbolId) continue;
        if ((cell.color ?? "").trim().toLowerCase() !== targetColor) continue;
        visited[nr * width + nc] = 1;
        stack.push([nr, nc]);
      }
    }

    set({ pattern: next, history: [...state.history, previous], future: [] });
  },

  setSelectedSymbolId: (selectedSymbolId) => set({ selectedSymbolId }),
  setSelectedColor: (selectedColor) => set({ selectedColor }),

  setSymbols: (symbols) => {
    const state = get();
    if (!state.pattern) return;
    const next = clonePattern(state.pattern);
    next.symbols = symbols;
    set({ pattern: next });
  },

  resizePattern: (newWidth, newHeight) => {
    const state = get();
    if (!state.pattern) return;
    const w = Math.max(1, Math.min(200, newWidth));
    const h = Math.max(1, Math.min(200, newHeight));
    const previous = clonePattern(state.pattern);
    const next = clonePattern(state.pattern);
    const defaultColor = next.palette[0]?.hex ?? "#f5ede1";
    const currentWidth = next.width;
    const currentHeight = next.height;

    next.cells = next.cells.map((row) => {
      if (w > currentWidth) {
        const extra = Array.from({ length: w - currentWidth }, () => ({ symbolId: "empty", color: defaultColor }));
        return [...row, ...extra];
      }
      return row.slice(0, w);
    });

    if (h > currentHeight) {
      for (let r = currentHeight; r < h; r++) {
        next.cells.push(Array.from({ length: w }, () => ({ symbolId: "empty", color: defaultColor })));
      }
    } else {
      next.cells = next.cells.slice(0, h);
    }

    next.width = w;
    next.height = h;
    next.rapportMarks = clipRapportMarks(next.rapportMarks, w, h);
    set({ pattern: next, history: [...state.history, previous], future: [] });
  },

  addEdge: (edge) => {
    const state = get();
    if (!state.pattern) return;
    const prev = clonePattern(state.pattern);
    const next = clonePattern(state.pattern);
    const def = next.palette[0]?.hex ?? "#f5ede1";
    const emptyRow = () => Array.from({ length: next.width }, () => ({ symbolId: "empty", color: def }));
    const emptyCell = () => ({ symbolId: "empty", color: def });

    if (edge === "top") { next.cells = [emptyRow(), ...next.cells]; next.height += 1; }
    else if (edge === "bottom") { next.cells = [...next.cells, emptyRow()]; next.height += 1; }
    else if (edge === "left") { next.cells = next.cells.map((row) => [emptyCell(), ...row]); next.width += 1; }
    else { next.cells = next.cells.map((row) => [...row, emptyCell()]); next.width += 1; }

    if (edge === "top") next.rapportMarks = shiftRapportMarks(next.rapportMarks, 1, 0);
    else if (edge === "left") next.rapportMarks = shiftRapportMarks(next.rapportMarks, 0, 1);

    set({ pattern: next, history: [...state.history, prev], future: [] });
  },

  removeEdge: (edge) => {
    const state = get();
    if (!state.pattern) return;
    const { width, height } = state.pattern;
    if ((edge === "top" || edge === "bottom") && height <= 1) return;
    if ((edge === "left" || edge === "right") && width <= 1) return;

    const prev = clonePattern(state.pattern);
    const next = clonePattern(state.pattern);

    if (edge === "top") { next.cells = next.cells.slice(1); next.height -= 1; }
    else if (edge === "bottom") { next.cells = next.cells.slice(0, -1); next.height -= 1; }
    else if (edge === "left") { next.cells = next.cells.map((row) => row.slice(1)); next.width -= 1; }
    else { next.cells = next.cells.map((row) => row.slice(0, -1)); next.width -= 1; }

    if (edge === "top") next.rapportMarks = clipRapportMarks(shiftRapportMarks(next.rapportMarks, -1, 0), next.width, next.height);
    else if (edge === "left") next.rapportMarks = clipRapportMarks(shiftRapportMarks(next.rapportMarks, 0, -1), next.width, next.height);
    else next.rapportMarks = clipRapportMarks(next.rapportMarks, next.width, next.height);

    set({ pattern: next, history: [...state.history, prev], future: [] });
  },

  toggleSkipPurlRows: () => {
    const state = get();
    if (!state.pattern) return;
    const next = clonePattern(state.pattern);
    next.view.skipPurlRows = !next.view.skipPurlRows;
    set({ pattern: next });
  },

  undo: () => {
    const state = get();
    if (!state.pattern || state.history.length === 0) return;
    const previous = state.history[state.history.length - 1];
    set({ pattern: previous, history: state.history.slice(0, -1), future: [clonePattern(state.pattern), ...state.future] });
  },

  redo: () => {
    const state = get();
    if (!state.pattern || state.future.length === 0) return;
    const next = state.future[0];
    set({ pattern: next, history: [...state.history, clonePattern(state.pattern)], future: state.future.slice(1) });
  },

  // ── Selection ──────────────────────────────────────────────────────────

  toggleSelectionMode: () => {
    const state = get();
    const next = !state.isSelectionMode;
    set({
      isSelectionMode: next,
      isSelecting: false,
      selectionStart: next ? state.selectionStart : null,
      selectionEnd: next ? state.selectionEnd : null,
      rapportInsertId: next ? null : state.rapportInsertId,
      isFillMode: next ? false : state.isFillMode,
    });
  },

  startSelection: (row, col) => {
    set({ isSelecting: true, selectionStart: [row, col], selectionEnd: [row, col] });
  },

  updateSelection: (row, col) => {
    set({ selectionEnd: [row, col] });
  },

  endSelection: () => {
    const state = get();
    if (!state.pattern || !state.selectionStart || !state.selectionEnd) {
      set({ isSelecting: false });
      return;
    }

    const r1 = Math.min(state.selectionStart[0], state.selectionEnd[0]);
    let r2 = Math.max(state.selectionStart[0], state.selectionEnd[0]);
    const c1 = Math.min(state.selectionStart[1], state.selectionEnd[1]);
    let c2 = Math.max(state.selectionStart[1], state.selectionEnd[1]);

    // Expand to fully include any multi-cell symbol with anchor in selection
    let expanded = true;
    while (expanded) {
      expanded = false;
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          const cell = state.pattern.cells[r]?.[c];
          if (!cell || cell.occupiedByAnchor) continue;
          const sym = state.pattern.symbols.find((s) => s.id === cell.symbolId);
          const sw = sym?.width ?? 1;
          const sh = sym?.height ?? 1;
          const newC2 = Math.min(c + sw - 1, state.pattern.width - 1);
          const newR2 = Math.min(r + sh - 1, state.pattern.height - 1);
          if (newC2 > c2) { c2 = newC2; expanded = true; }
          if (newR2 > r2) { r2 = newR2; expanded = true; }
        }
      }
    }

    set({ isSelecting: false, selectionStart: [r1, c1], selectionEnd: [r2, c2] });
  },

  clearSelection: () => {
    set({ selectionStart: null, selectionEnd: null, isSelecting: false });
  },

  saveSelectionAsRapport: (name: string) => {
    const state = get();
    if (!state.pattern || !state.selectionStart || !state.selectionEnd) return;

    // Bounds already expanded by endSelection
    const r1 = Math.min(state.selectionStart[0], state.selectionEnd[0]);
    const r2 = Math.max(state.selectionStart[0], state.selectionEnd[0]);
    const c1 = Math.min(state.selectionStart[1], state.selectionEnd[1]);
    const c2 = Math.max(state.selectionStart[1], state.selectionEnd[1]);

    const cells: PatternCell[][] = [];
    for (let r = r1; r <= r2; r++) {
      const rowCells: PatternCell[] = [];
      for (let c = c1; c <= c2; c++) {
        const cell = state.pattern.cells[r][c];
        if (cell.occupiedByAnchor) {
          const [anchorR, anchorC] = cell.occupiedByAnchor;
          if (anchorR >= r1 && anchorR <= r2 && anchorC >= c1 && anchorC <= c2) {
            rowCells.push({ ...cell, occupiedByAnchor: [anchorR - r1, anchorC - c1] });
          } else {
            rowCells.push({ symbolId: "empty", color: cell.color });
          }
        } else {
          rowCells.push({ ...cell });
        }
      }
      cells.push(rowCells);
    }

    const rapport: Rapport = {
      id: nanoid(),
      name: name.trim(),
      width: c2 - c1 + 1,
      height: r2 - r1 + 1,
      cells
    };

    const previous = clonePattern(state.pattern);
    const next = clonePattern(state.pattern);
    next.rapports = [...(next.rapports ?? []), rapport];
    const mark: RapportMark = { id: markId(), row: r1, col: c1, width: rapport.width, height: rapport.height, rapportId: rapport.id };
    next.rapportMarks = [...(next.rapportMarks ?? []), mark];

    set({
      pattern: next,
      history: [...state.history, previous],
      future: [],
      selectionStart: null,
      selectionEnd: null,
      isSelectionMode: false,
      isSelecting: false
    });
  },

  markSelectionAsRapport: () => {
    const state = get();
    if (!state.pattern || !state.selectionStart || !state.selectionEnd) return;

    // Bounds already expanded by endSelection
    const r1 = Math.min(state.selectionStart[0], state.selectionEnd[0]);
    const c1 = Math.min(state.selectionStart[1], state.selectionEnd[1]);
    const width = Math.abs(state.selectionEnd[1] - state.selectionStart[1]) + 1;
    const height = Math.abs(state.selectionEnd[0] - state.selectionStart[0]) + 1;

    const previous = clonePattern(state.pattern);
    const next = clonePattern(state.pattern);
    const mark: RapportMark = { id: markId(), row: r1, col: c1, width, height };
    next.rapportMarks = [...(next.rapportMarks ?? []), mark];

    set({
      pattern: next,
      history: [...state.history, previous],
      future: [],
      selectionStart: null,
      selectionEnd: null,
      isSelectionMode: false,
      isSelecting: false
    });
  },

  removeRapportMark: (id: string) => {
    const state = get();
    if (!state.pattern) return;
    const previous = clonePattern(state.pattern);
    const next = clonePattern(state.pattern);
    next.rapportMarks = (next.rapportMarks ?? []).filter((m) => m.id !== id);
    set({
      pattern: next,
      history: [...state.history, previous],
      future: []
    });
  },

  clearRapportMarks: () => {
    const state = get();
    if (!state.pattern) return;
    const previous = clonePattern(state.pattern);
    const next = clonePattern(state.pattern);
    next.rapportMarks = [];
    set({
      pattern: next,
      history: [...state.history, previous],
      future: []
    });
  },

  deleteRapport: (id: string) => {
    const state = get();
    if (!state.pattern) return;
    const previous = clonePattern(state.pattern);
    const next = clonePattern(state.pattern);
    next.rapports = (next.rapports ?? []).filter((r) => r.id !== id);
    set({
      pattern: next,
      history: [...state.history, previous],
      future: [],
      rapportInsertId: state.rapportInsertId === id ? null : state.rapportInsertId
    });
  },

  // ── Insert ─────────────────────────────────────────────────────────────

  startRapportInsert: (id: string) => {
    set({
      rapportInsertId: id,
      rapportMirror: "none",
      isSelectionMode: false,
      isSelecting: false,
      selectionStart: null,
      selectionEnd: null,
      isFillMode: false
    });
  },

  cancelRapportInsert: () => {
    set({ rapportInsertId: null, rapportMirror: "none" });
  },

  insertRapport: (anchorRow: number, anchorCol: number) => {
    const state = get();
    if (!state.pattern || !state.rapportInsertId) return;

    const rapportRecord = (state.pattern.rapports ?? []).find((r) => r.id === state.rapportInsertId);
    if (!rapportRecord) return;

    // Apply mirror transform before insertion (cells regenerated, original untouched)
    const rapport = {
      ...rapportRecord,
      cells: mirrorRapportCells(
        rapportRecord.cells,
        rapportRecord.width,
        rapportRecord.height,
        state.rapportMirror,
        state.pattern.symbols
      )
    };

    // Auto-clip to pattern bounds
    const insertHeight = Math.min(rapport.height, state.pattern.height - anchorRow);
    const insertWidth = Math.min(rapport.width, state.pattern.width - anchorCol);
    if (insertHeight <= 0 || insertWidth <= 0) return;

    const previous = clonePattern(state.pattern);
    const next = clonePattern(state.pattern);
    const defaultColor = next.palette[0]?.hex ?? "#f5ede1";

    // Clear target area
    for (let r = anchorRow; r < anchorRow + insertHeight; r++) {
      for (let c = anchorCol; c < anchorCol + insertWidth; c++) {
        findAndClearOccupyingSymbol(next.cells, next.symbols, r, c, defaultColor);
      }
    }

    // Track anchors that were skipped because symbol doesn't fit
    const skippedAnchors = new Set<string>();

    // Pass 1: place anchor cells
    for (let localR = 0; localR < insertHeight; localR++) {
      for (let localC = 0; localC < insertWidth; localC++) {
        const cell = rapport.cells[localR][localC];
        if (cell.occupiedByAnchor) continue;

        const targetR = anchorRow + localR;
        const targetC = anchorCol + localC;
        const sym = next.symbols.find((s) => s.id === cell.symbolId);
        const sw = sym?.width ?? 1;
        const sh = sym?.height ?? 1;

        if (targetR + sh > next.height || targetC + sw > next.width) {
          // Symbol doesn't fit — place as empty, mark as skipped
          next.cells[targetR][targetC] = { symbolId: "empty", color: cell.color };
          if (sw > 1 || sh > 1) skippedAnchors.add(`${localR},${localC}`);
        } else {
          next.cells[targetR][targetC] = { ...cell };
        }
      }
    }

    // Pass 2: place occupied cells
    for (let localR = 0; localR < insertHeight; localR++) {
      for (let localC = 0; localC < insertWidth; localC++) {
        const cell = rapport.cells[localR][localC];
        if (!cell.occupiedByAnchor) continue;

        const [localAnchorR, localAnchorC] = cell.occupiedByAnchor;
        const targetR = anchorRow + localR;
        const targetC = anchorCol + localC;

        if (skippedAnchors.has(`${localAnchorR},${localAnchorC}`)) {
          next.cells[targetR][targetC] = { symbolId: "empty", color: cell.color };
        } else if (localAnchorR >= 0 && localAnchorR < insertHeight && localAnchorC >= 0 && localAnchorC < insertWidth) {
          next.cells[targetR][targetC] = {
            ...cell,
            occupiedByAnchor: [anchorRow + localAnchorR, anchorCol + localAnchorC]
          };
        } else {
          next.cells[targetR][targetC] = { symbolId: "empty", color: cell.color };
        }
      }
    }

    const insertedMark: RapportMark = { id: markId(), row: anchorRow, col: anchorCol, width: insertWidth, height: insertHeight, rapportId: state.rapportInsertId };
    next.rapportMarks = [...(next.rapportMarks ?? []), insertedMark];

    set({
      pattern: next,
      history: [...state.history, previous],
      future: [],
      rapportInsertId: null
    });
  }
}));
