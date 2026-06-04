"use client";

import { create } from "zustand";
import { PatternDocument, PatternGrid, PatternSymbol } from "@/lib/patterns/model";

function getSymbolWidth(symbolId: string, symbols: PatternSymbol[]): number {
  const symbol = symbols.find((s) => s.id === symbolId);
  return symbol?.width ?? 1;
}

function clearMultiCellSymbol(cells: PatternGrid, row: number, anchorCol: number, width: number, defaultColor: string) {
  for (let c = anchorCol; c < anchorCol + width && c < cells[row].length; c++) {
    cells[row][c] = { symbolId: "empty", color: defaultColor };
  }
}

function findAndClearOccupyingSymbol(cells: PatternGrid, symbols: PatternSymbol[], row: number, col: number, defaultColor: string) {
  const cell = cells[row][col];
  if (cell.occupiedByAnchor) {
    const [anchorRow, anchorCol] = cell.occupiedByAnchor;
    const anchorCell = cells[anchorRow][anchorCol];
    const width = getSymbolWidth(anchorCell.symbolId, symbols);
    clearMultiCellSymbol(cells, anchorRow, anchorCol, width, defaultColor);
  } else {
    const width = getSymbolWidth(cell.symbolId, symbols);
    if (width > 1) {
      clearMultiCellSymbol(cells, row, col, width, defaultColor);
    }
  }
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
  setPattern: (pattern: PatternDocument) => void;
  paintCell: (row: number, column: number) => void;
  setSelectedSymbolId: (symbolId: string) => void;
  setSelectedColor: (color: string) => void;
  setSymbols: (symbols: PatternDocument["symbols"]) => void;
  resizePattern: (newWidth: number, newHeight: number) => void;
  clearToast: () => void;
  undo: () => void;
  redo: () => void;
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
    if (!state.pattern) {
      return;
    }
    const previous = clonePattern(state.pattern);
    const next = clonePattern(state.pattern);
    const symbols = next.symbols;
    const width = getSymbolWidth(state.selectedSymbolId, symbols);
    const defaultColor = next.palette[0]?.hex ?? "#f5ede1";

    // Check if there's enough room for multi-cell symbol
    if (column + width > next.width) {
      set({ toastData: { key: "toast.notEnoughSpace", params: { needed: width, available: next.width - column } } });
      return;
    }

    // Check all target cells and clear any conflicting multi-cell symbols
    for (let c = column; c < column + width; c++) {
      const targetCell = next.cells[row][c];
      if (targetCell.occupiedByAnchor || getSymbolWidth(targetCell.symbolId, symbols) > 1) {
        findAndClearOccupyingSymbol(next.cells, symbols, row, c, defaultColor);
      }
    }

    // Place the anchor cell
    next.cells[row][column] = {
      symbolId: state.selectedSymbolId,
      color: state.selectedColor
    };

    // Place occupied cells for multi-cell symbols
    for (let c = column + 1; c < column + width; c++) {
      next.cells[row][c] = {
        symbolId: "empty",
        color: state.selectedColor,
        occupiedByAnchor: [row, column]
      };
    }

    set({
      pattern: next,
      history: [...state.history, previous],
      future: []
    });
  },
  setSelectedSymbolId: (selectedSymbolId) => set({ selectedSymbolId }),
  setSelectedColor: (selectedColor) => set({ selectedColor }),
  setSymbols: (symbols) => {
    const state = get();
    if (!state.pattern) {
      return;
    }
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

    // Adjust each row width
    next.cells = next.cells.map((row) => {
      if (w > currentWidth) {
        const extra = Array.from({ length: w - currentWidth }, () => ({
          symbolId: "empty",
          color: defaultColor
        }));
        return [...row, ...extra];
      }
      return row.slice(0, w);
    });

    // Adjust height
    if (h > currentHeight) {
      for (let r = currentHeight; r < h; r++) {
        next.cells.push(
          Array.from({ length: w }, () => ({ symbolId: "empty", color: defaultColor }))
        );
      }
    } else {
      next.cells = next.cells.slice(0, h);
    }

    next.width = w;
    next.height = h;
    set({ pattern: next, history: [...state.history, previous], future: [] });
  },
  undo: () => {
    const state = get();
    if (!state.pattern || state.history.length === 0) {
      return;
    }
    const previous = state.history[state.history.length - 1];
    set({
      pattern: previous,
      history: state.history.slice(0, -1),
      future: [clonePattern(state.pattern), ...state.future]
    });
  },
  redo: () => {
    const state = get();
    if (!state.pattern || state.future.length === 0) {
      return;
    }
    const next = state.future[0];
    set({
      pattern: next,
      history: [...state.history, clonePattern(state.pattern)],
      future: state.future.slice(1)
    });
  }
}));