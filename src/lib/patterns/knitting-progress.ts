"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type KnittingProgress = { row: number; active: boolean };

export const KNITTING_STORAGE_PREFIX = "crossyarn:knit:";

export function getVisibleRowNumbers(height: number, skipPurl: boolean): number[] {
  if (height < 1) return [];
  const rows: number[] = [];
  for (let i = 1; i <= height; i += skipPurl ? 2 : 1) {
    rows.push(i);
  }
  return rows;
}

export function stepRow(rowNumbers: number[], current: number, delta: number): number {
  if (rowNumbers.length === 0) return current;
  let index = rowNumbers.findIndex((n) => n >= current);
  if (index === -1) index = rowNumbers.length - 1;
  index = Math.max(0, Math.min(rowNumbers.length - 1, index + delta));
  return rowNumbers[index];
}

export function parseStoredProgress(raw: string | null, height: number): KnittingProgress | null {
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    const { row, active } = parsed as { row?: unknown; active?: unknown };
    if (typeof row !== "number" || !Number.isInteger(row) || row < 1 || row > height) return null;
    if (typeof active !== "boolean") return null;
    return { row, active };
  } catch {
    return null;
  }
}

export function useKnittingProgress(
  patternId: string,
  height: number,
  skipPurl: boolean
): {
  active: boolean;
  row: number;
  total: number;
  position: number;
  rowNumbers: number[];
  setActive: (active: boolean) => void;
  goTo: (row: number) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
} {
  const rowNumbers = useMemo(() => getVisibleRowNumbers(height, skipPurl), [height, skipPurl]);
  const storageKey = KNITTING_STORAGE_PREFIX + patternId;
  const [progress, setProgress] = useState<KnittingProgress>({ row: rowNumbers[0] ?? 1, active: false });

  useEffect(() => {
    try {
      const parsed = parseStoredProgress(localStorage.getItem(storageKey), height);
      if (parsed) {
        queueMicrotask(() => setProgress({ row: stepRow(rowNumbers, parsed.row, 0), active: parsed.active }));
      }
    } catch {
      /* storage unavailable */
    }
  }, [storageKey, height, rowNumbers]);

  const save = useCallback(
    (next: KnittingProgress) => {
      setProgress(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
    },
    [storageKey]
  );

  const setActive = useCallback(
    (active: boolean) => {
      save({ ...progress, active });
    },
    [progress, save]
  );

  const goTo = useCallback(
    (row: number) => {
      save({ ...progress, row: stepRow(rowNumbers, row, 0) });
    },
    [progress, rowNumbers, save]
  );

  const next = useCallback(() => {
    save({ ...progress, row: stepRow(rowNumbers, progress.row, 1) });
  }, [progress, rowNumbers, save]);

  const prev = useCallback(() => {
    save({ ...progress, row: stepRow(rowNumbers, progress.row, -1) });
  }, [progress, rowNumbers, save]);

  // Back to the first row; stays in knitting mode (exiting is a separate action).
  const reset = useCallback(() => {
    save({ row: rowNumbers[0] ?? 1, active: progress.active });
  }, [progress.active, rowNumbers, save]);

  return {
    active: progress.active,
    row: progress.row,
    total: rowNumbers.length,
    position: rowNumbers.indexOf(progress.row) + 1,
    rowNumbers,
    setActive,
    goTo,
    next,
    prev,
    reset,
  };
}
