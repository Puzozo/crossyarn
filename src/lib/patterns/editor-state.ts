"use client";

import { create } from "zustand";
import { PatternDocument, PatternGrid, PatternSymbol, Rapport, PatternCell } from "@/lib/patterns/model";

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

function nanoid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export type ToastData = {
  key: string;
  params?: Record<string, string | number>;
} | null;

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

  setPattern: (pattern: PatternDocument) => void;
  paintCell: (row: number, column: number) => void;
  setSelectedSymbolId: (symbolId: string) => void;
  setSelectedColor: (color: string) => void;
  setSymbols: (symbols: PatternDocument["symbols"]) => void;
  resizePattern: (newWidth: number, newHeight: number) => void;
  addEdge: (edge: "top" | "bottom" | "left" | "right") => void;
  clearToast: () => void;
  undo: () => void;
  redo: () => void;

  toggleSelectionMode: () => void;
  startSelection: (row: number, col: number) => void;
  updateSelection: (row: number, col: number) => void;
  endSelection: () => void;
  clearSelection: () => void;
  saveSelectionAsRapport: (name: string) => void;
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

  clearToast: () => set({ toastData: null }),

  setPattern: (pattern) =>
    set({
      pattern,
      history: [],
      future: [],
      selectedColor: pattern.palette[0]?.hex ?? "#f5ede1",
      selectedSymbolId: pattern.symbols[0]?.id ?? "empty"
    }),

  paintCell: (row, column) => {
    const state = get();
    if (!state.pattern) return;
    const previous = clonePattern(state.pattern);
    const next = clonePattern(state.pattern);
    const symbols = next.symbols;
    const width = getSymbolWidth(state.selectedSymbolId, symbols);
    const height = getSymbolHeight(state.selectedSymbolId, symbols);
    const defaultColor = next.palette[0]?.hex ?? "#f5ede1";

    if (column + width > next.width) {
      set({ toastData: { key: "toast.notEnoughSpace", params: { needed: width, available: next.width - column } } });
      return;
    }
    if (row + height > next.height) {
      set({ toastData: { key: "toast.notEnoughSpace", params: { needed: height, available: next.height - row } } });
      return;
    }

    for (let r = row; r < row + height; r++) {
      for (let c = column; c < column + width; c++) {
        const targetCell = next.cells[r][c];
        if (
          targetCell.occupiedByAnchor ||
          getSymbolWidth(targetCell.symbolId, symbols) > 1 ||
          getSymbolHeight(targetCell.symbolId, symbols) > 1
        ) {
          findAndClearOccupyingSymbol(next.cells, symbols, r, c, defaultColor);
        }
      }
    }

    next.cells[row][column] = { symbolId: state.selectedSymbolId, color: state.selectedColor };

    for (let r = row; r < row + height; r++) {
      for (let c = column; c < column + width; c++) {
        if (r === row && c === column) continue;
        next.cells[r][c] = { symbolId: "empty", color: state.selectedColor, occupiedByAnchor: [row, column] };
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

    set({ pattern: next, history: [...state.history, prev], future: [] });
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

    let r1 = Math.min(state.selectionStart[0], state.selectionEnd[0]);
    let r2 = Math.max(state.selectionStart[0], state.selectionEnd[0]);
    let c1 = Math.min(state.selectionStart[1], state.selectionEnd[1]);
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
      isSelectionMode: false,
      isSelecting: false,
      selectionStart: null,
      selectionEnd: null
    });
  },

  cancelRapportInsert: () => {
    set({ rapportInsertId: null });
  },

  insertRapport: (anchorRow: number, anchorCol: number) => {
    const state = get();
    if (!state.pattern || !state.rapportInsertId) return;

    const rapport = (state.pattern.rapports ?? []).find((r) => r.id === state.rapportInsertId);
    if (!rapport) return;

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

    set({
      pattern: next,
      history: [...state.history, previous],
      future: [],
      rapportInsertId: null
    });
  }
}));
