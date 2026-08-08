"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";
import {
  CONFIDENCE_THRESHOLD,
  IMPORT_STAGES,
  ImportCell,
  ImportGlyph,
  ImportResult,
  PatternImportStage
} from "@/lib/import-pipeline/contracts";
import {
  DEFAULT_PALETTE,
  DEFAULT_SYMBOLS,
  PatternCell,
  PatternDocument,
  PatternSymbol
} from "@/lib/patterns/model";

type JobStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";

type Props = {
  importId: string;
  initialStatus: string;
};

const UNKNOWN_SELECT = "__unknown__";

export function ImportPreviewContent({ importId, initialStatus }: Props) {
  const { t } = useTranslation();
  const router = useRouter();

  const [status, setStatus] = useState<JobStatus>(initialStatus as JobStatus);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [glyphs, setGlyphs] = useState<Record<string, ImportGlyph>>({});
  const [cells, setCells] = useState<ImportCell[][]>([]);
  const [stages, setStages] = useState<PatternImportStage[]>([]);
  const [gridW, setGridW] = useState(0);
  const [gridH, setGridH] = useState(0);
  const [deskewFailed, setDeskewFailed] = useState(false);
  const [palette, setPalette] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [availableSymbols, setAvailableSymbols] = useState<PatternSymbol[]>(DEFAULT_SYMBOLS);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [hovered, setHovered] = useState<[number, number] | null>(null);
  const [activeTab, setActiveTab] = useState<"original" | "preview" | "legend">("preview");
  const [saving, setSaving] = useState(false);
  const [redetecting, setRedetecting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // ── Load standard symbols once (for remap dropdowns + rendering) ────────────
  useEffect(() => {
    void fetch("/api/symbols")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setAvailableSymbols(data);
      })
      .catch(() => undefined);
  }, []);

  const applyResult = useCallback((result: ImportResult) => {
    setGlyphs(result.glyphs);
    setCells(result.cells);
    setStages(result.stages ?? IMPORT_STAGES);
    setGridW(result.grid.width);
    setGridH(result.grid.height);
    setDeskewFailed(Boolean(result.deskewFailed));
    setPalette(result.palette ?? []);
    setTitle(result.suggestedTitle || t("import.suggestedTitle"));
  }, [t]);

  // ── Fetch current state on mount, then poll while not terminal ──────────────
  // The mock engine can finish before this page renders, so we always do one fetch
  // (even when the initial status is already READY) to load the result.
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/imports/${importId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.status === "READY" && data.result) {
          applyResult(data.result as ImportResult);
          setStatus("READY");
        } else if (data.status === "FAILED") {
          setErrorType(data.errorMessage ?? "internal-error");
          setStatus("FAILED");
        } else {
          setStatus(data.status as JobStatus);
        }
      } catch {
        /* transient — keep polling */
      }
    }

    void poll();
    if (status === "READY" || status === "FAILED") {
      return () => {
        cancelled = true;
      };
    }
    const interval = setInterval(poll, 2500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [status, importId, applyResult]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const realH = cells.length;
  const realW = cells[0]?.length ?? 0;

  const lowConfidenceCount = cells.reduce((acc, row) => {
    return (
      acc +
      row.filter(
        (c) => c.hash !== "empty" && !c.overrideSymbolId && c.confidence < CONFIDENCE_THRESHOLD
      ).length
    );
  }, 0);

  const unknownGlyphList = Object.values(glyphs).filter(
    (g) => g.hash !== "empty" && !g.mappedSymbolId
  );

  function symbolById(id: string): PatternSymbol | undefined {
    return availableSymbols.find((s) => s.id === id);
  }

  /** Resolve what a cell should display: a known symbol, or an unknown glyph image,
   *  plus its cell span (width/height) so multi-cell symbols render correctly. */
  function resolveCell(cell: ImportCell): { symbol?: PatternSymbol; unknownImage?: string; width: number; height: number } {
    const g = glyphs[cell.hash];
    const overrideOrMapped = cell.overrideSymbolId ?? g?.mappedSymbolId ?? null;
    if (overrideOrMapped) {
      const s = symbolById(overrideOrMapped);
      return { symbol: s, width: s?.width ?? 1, height: s?.height ?? 1 };
    }
    return { unknownImage: g?.image, width: g?.width ?? 1, height: g?.height ?? 1 };
  }

  // ── Editing actions ───────────────────────────────────────────────────────
  function remapGlyph(hash: string, symbolId: string | null) {
    setGlyphs((prev) => {
      const g = prev[hash];
      if (!g) return prev;
      const next = { ...g, mappedSymbolId: symbolId };
      if (!symbolId && !next.suggestedName) next.suggestedName = "Unknown";
      return { ...prev, [hash]: next };
    });
  }

  function renameGlyph(hash: string, name: string) {
    setGlyphs((prev) => {
      const g = prev[hash];
      if (!g) return prev;
      return { ...prev, [hash]: { ...g, suggestedName: name } };
    });
  }

  function setCellOverride(r: number, c: number, symbolId: string | undefined) {
    setCells((prev) =>
      prev.map((row, ri) =>
        ri === r ? row.map((cell, ci) => (ci === c ? { ...cell, overrideSymbolId: symbolId } : cell)) : row
      )
    );
  }

  async function handleRedetect() {
    setRedetecting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/imports/${importId}/redetect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ width: gridW, height: gridH })
      });
      if (res.ok) {
        setStatus("PENDING");
        setSelectedCell(null);
      } else {
        setActionError(t("import.failed.generic"));
      }
    } catch {
      setActionError(t("import.failed.generic"));
    } finally {
      setRedetecting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setActionError(null);
    try {
      // 1. Create a UserSymbol for each unknown glyph (only now, at save).
      const hashToSymbolId: Record<string, string> = {};
      for (const g of unknownGlyphList) {
        const rawName = (g.suggestedName || "Unknown").trim();
        const name = rawName.length >= 2 ? rawName.slice(0, 80) : "Unknown";
        const res = await fetch("/api/symbols", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description: t("import.description"),
            imageData: g.image,
            width: g.width,
            height: g.height
          })
        });
        if (!res.ok) {
          setActionError(t("import.saveError"));
          setSaving(false);
          return;
        }
        const rec = await res.json();
        hashToSymbolId[g.hash] = `user-${rec.id}`;
      }

      // 2. Resolve every cell to a concrete symbol id.
      const referenced = new Set<string>(["empty"]);
      const patternCells: PatternCell[][] = cells.map((row) =>
        row.map((cell) => {
          const id =
            cell.overrideSymbolId ??
            glyphs[cell.hash]?.mappedSymbolId ??
            hashToSymbolId[cell.hash] ??
            "empty";
          referenced.add(id);
          const pc: PatternCell = { symbolId: id, color: cell.color };
          if (cell.occupiedByAnchor) pc.occupiedByAnchor = cell.occupiedByAnchor;
          return pc;
        })
      );

      // 3. Build the symbol set referenced by the grid.
      const newUnknownSymbols: PatternSymbol[] = unknownGlyphList.map((g) => ({
        id: hashToSymbolId[g.hash],
        label: (g.suggestedName || "Unknown").trim() || "Unknown",
        imageData: g.image,
        source: "user" as const,
        width: g.width > 1 ? g.width : undefined,
        height: g.height > 1 ? g.height : undefined
      }));

      const symbols: PatternSymbol[] = [];
      for (const id of referenced) {
        const found = newUnknownSymbols.find((s) => s.id === id) ?? symbolById(id);
        if (found) symbols.push(found);
      }
      if (!symbols.find((s) => s.id === "empty")) {
        const empty = DEFAULT_SYMBOLS.find((s) => s.id === "empty");
        if (empty) symbols.push(empty);
      }

      const width = realW;
      const height = realH;
      // Use the detected jacquard palette when present; else the default swatches.
      // (Cells carry explicit hex regardless, so colours render either way.)
      const patternPalette = palette.length
        ? palette.map((hex, i) => ({ id: `c${i}`, name: `Колір ${i + 1}`, hex }))
        : DEFAULT_PALETTE;
      const patternData: PatternDocument = {
        version: 1,
        width,
        height,
        cells: patternCells,
        symbols,
        palette: patternPalette,
        view: { showGrid: true, showRowNumbers: true, showColumnNumbers: true }
      };

      const created = await fetch("/api/patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || t("import.suggestedTitle"),
          description: "",
          width,
          height,
          patternData
        })
      });
      const data = await created.json().catch(() => null);
      if (!created.ok || !data?.id) {
        setActionError(t("import.saveError"));
        setSaving(false);
        return;
      }
      router.push(`/editor/${data.id}`);
    } catch {
      setActionError(t("import.saveError"));
      setSaving(false);
    }
  }

  // ── Render: processing / failed / ready ─────────────────────────────────────
  if (status === "PENDING" || status === "PROCESSING") {
    return <ProcessingView importId={importId} stages={stages} />;
  }
  if (status === "FAILED") {
    return <FailedView errorType={errorType} />;
  }

  // READY
  return (
    <div className="space-y-4 pb-24 lg:pb-6">
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-yarn-sand/40 bg-yarn-cream/95 px-1 py-3 backdrop-blur-sm">
        <Link href="/patterns" className="text-sm text-yarn-warm-gray hover:text-yarn-charcoal">
          ← {t("import.backToPatterns")}
        </Link>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label={t("import.patternName")}
          className="min-w-0 flex-1 rounded-lg bg-transparent px-2 py-1 font-display text-base font-semibold text-yarn-charcoal focus:bg-white focus:outline-none focus:ring-1 focus:ring-yarn-terracotta/40"
        />
        <Button size="sm" onClick={() => void handleSave()} disabled={saving} className="hidden lg:inline-flex">
          {saving ? t("import.saving") : t("import.savePattern")}
        </Button>
      </div>

      {actionError && <p className="text-sm text-red-600">{actionError}</p>}

      {/* Mobile tabs */}
      <div className="flex border-b border-yarn-sand/40 lg:hidden">
        {(["original", "preview", "legend"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-b-2 border-yarn-terracotta text-yarn-terracotta"
                : "text-yarn-warm-gray"
            }`}
          >
            {t(`import.tab.${tab}` as never)}
          </button>
        ))}
      </div>

      <div className="lg:grid lg:grid-cols-[1fr,1fr,320px] lg:gap-5">
        {/* Panel A — original + overlay */}
        <div className={`${activeTab === "original" ? "block" : "hidden"} space-y-3 lg:block`}>
          <OriginalOverlay
            importId={importId}
            width={realW}
            height={realH}
            cells={cells}
            hovered={hovered}
          />
          <div className="space-y-2 rounded-xl border border-yarn-sand/50 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-yarn-warm-gray">
              {t("import.gridSize")}
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={200}
                value={gridW}
                onChange={(e) => setGridW(Math.max(1, Math.min(200, Number(e.target.value))))}
                className="w-16 rounded-lg border border-yarn-sand bg-white px-2 py-1.5 text-center text-sm font-mono"
              />
              <span className="text-yarn-warm-gray">×</span>
              <input
                type="number"
                min={1}
                max={200}
                value={gridH}
                onChange={(e) => setGridH(Math.max(1, Math.min(200, Number(e.target.value))))}
                className="w-16 rounded-lg border border-yarn-sand bg-white px-2 py-1.5 text-center text-sm font-mono"
              />
              <Button size="sm" variant="secondary" onClick={() => void handleRedetect()} disabled={redetecting}>
                {redetecting ? t("import.redetecting") : t("import.redetect")}
              </Button>
            </div>
            {deskewFailed && (
              <p className="text-[11px] text-amber-600">⚠ {t("import.deskewWarning")}</p>
            )}
          </div>
        </div>

        {/* Panel B — live preview */}
        <div className={`${activeTab === "preview" ? "block" : "hidden"} space-y-3 lg:block`}>
          <p className="text-xs font-medium text-yarn-warm-gray">
            {lowConfidenceCount > 0
              ? t("import.lowConfidenceWarning", { n: lowConfidenceCount })
              : t("import.allChecked")}
          </p>
          <PreviewGrid
            cells={cells}
            width={realW}
            resolveCell={resolveCell}
            threshold={CONFIDENCE_THRESHOLD}
            selectedCell={selectedCell}
            onSelectCell={(r, c) => setSelectedCell([r, c])}
            onHoverCell={setHovered}
          />
          {selectedCell && (
            <CellFixPanel
              symbols={availableSymbols}
              onPick={(id) => {
                setCellOverride(selectedCell[0], selectedCell[1], id);
                setSelectedCell(null);
              }}
              onClear={() => {
                setCellOverride(selectedCell[0], selectedCell[1], undefined);
                setSelectedCell(null);
              }}
              onClose={() => setSelectedCell(null)}
            />
          )}
        </div>

        {/* Panel C — legend + unknown */}
        <div className={`${activeTab === "legend" ? "block" : "hidden"} space-y-4 lg:block`}>
          <LegendPanel
            glyphs={glyphs}
            symbols={availableSymbols}
            legendDetected={Object.values(glyphs).some((g) => g.description)}
            onRemap={remapGlyph}
            symbolById={symbolById}
          />
          {unknownGlyphList.length > 0 && (
            <UnknownPanel glyphs={unknownGlyphList} onRename={renameGlyph} />
          )}
        </div>
      </div>

      {/* Mobile sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-yarn-sand/40 bg-white/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        {lowConfidenceCount > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
            ⚠ {lowConfidenceCount}
          </span>
        )}
        <Button className="ml-auto" onClick={() => void handleSave()} disabled={saving}>
          {saving ? t("import.saving") : t("import.savePattern")}
        </Button>
      </div>
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

function ProcessingView({
  importId,
  stages
}: {
  importId: string;
  stages: PatternImportStage[];
}) {
  const { t } = useTranslation();
  const list = stages.length > 0 ? stages : IMPORT_STAGES;
  const stageKey: Record<PatternImportStage, string> = {
    uploaded: "import.stage.uploaded",
    preprocessed: "import.stage.preprocessed",
    "grid-detected": "import.stage.gridDetected",
    segmented: "import.stage.segmented",
    converted: "import.stage.converted",
    ready: "import.stage.ready"
  };
  return (
    <div className="mx-auto max-w-md space-y-5 py-10">
      <Link href="/patterns" className="text-sm text-yarn-warm-gray hover:text-yarn-charcoal">
        ← {t("import.backToPatterns")}
      </Link>
      <div className="space-y-4 rounded-2xl border border-yarn-sand/50 bg-white p-6 shadow-warm-sm">
        <div>
          <h1 className="font-display text-xl font-semibold text-yarn-charcoal">{t("import.processing")}</h1>
          <p className="text-sm text-yarn-warm-gray">{t("import.processingSubtitle")}</p>
        </div>
        <ul className="space-y-2.5">
          {list.map((stage, i) => (
            <li key={stage} className="flex items-center gap-3">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  i === 0
                    ? "bg-yarn-terracotta text-white"
                    : "border border-yarn-sand text-yarn-warm-gray"
                } ${i === 1 ? "animate-pulse" : ""}`}
              >
                {i === 0 ? "✓" : ""}
              </span>
              <span className="text-sm text-yarn-charcoal">{t(stageKey[stage] as never)}</span>
            </li>
          ))}
        </ul>
        <div className="h-1.5 overflow-hidden rounded-full bg-yarn-sand">
          <div className="h-full w-1/3 animate-pulse bg-yarn-terracotta" />
        </div>
      </div>
      <p className="text-center text-[11px] text-yarn-warm-gray/60">#{importId.slice(0, 8)}</p>
    </div>
  );
}

function FailedView({ errorType }: { errorType: string | null }) {
  const { t } = useTranslation();
  const titleKey =
    errorType === "grid-detection-failed"
      ? "import.failed.grid"
      : errorType === "timeout" || errorType === "service-unavailable"
        ? "import.failed.timeout"
        : "import.failed.generic";
  return (
    <div className="mx-auto max-w-md space-y-5 py-12 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 text-xl">
        ✕
      </span>
      <div className="space-y-1.5">
        <h1 className="font-display text-xl font-bold text-yarn-charcoal">{t(titleKey as never)}</h1>
        <p className="text-sm text-yarn-warm-gray">{t("import.failed.subtitle")}</p>
      </div>
      <div className="flex justify-center gap-3">
        <Link href="/patterns">
          <Button>{t("import.tryAgain")}</Button>
        </Link>
      </div>
    </div>
  );
}

function OriginalOverlay({
  importId,
  width,
  height,
  cells,
  hovered
}: {
  importId: string;
  width: number;
  height: number;
  cells: ImportCell[][];
  hovered: [number, number] | null;
}) {
  if (width === 0 || height === 0) return null;
  return (
    <div className="relative inline-block w-full overflow-hidden rounded-xl border border-yarn-sand/50 bg-yarn-oatmeal">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/imports/${importId}/image`}
        alt=""
        className="block h-auto w-full select-none"
        draggable={false}
      />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {cells.flatMap((row, r) =>
          row.map((cell, c) => {
            const low = cell.hash !== "empty" && !cell.overrideSymbolId && cell.confidence < CONFIDENCE_THRESHOLD;
            const isHover = hovered && hovered[0] === r && hovered[1] === c;
            return (
              <rect
                key={`${r}-${c}`}
                x={c}
                y={r}
                width={1}
                height={1}
                fill={isHover ? "rgba(225,124,74,0.25)" : low ? "rgba(234,179,8,0.28)" : "transparent"}
                stroke="rgba(225,124,74,0.5)"
                strokeWidth={0.02}
              />
            );
          })
        )}
      </svg>
    </div>
  );
}

function PreviewGrid({
  cells,
  width,
  resolveCell,
  threshold,
  selectedCell,
  onSelectCell,
  onHoverCell
}: {
  cells: ImportCell[][];
  width: number;
  resolveCell: (cell: ImportCell) => { symbol?: PatternSymbol; unknownImage?: string; width: number; height: number };
  threshold: number;
  selectedCell: [number, number] | null;
  onSelectCell: (r: number, c: number) => void;
  onHoverCell: (rc: [number, number] | null) => void;
}) {
  if (width === 0) return null;
  return (
    <div
      className="grid gap-px overflow-auto rounded-xl border border-yarn-sand/50 bg-yarn-sand/60 p-px"
      style={{
        gridTemplateColumns: `repeat(${width}, minmax(18px, 1fr))`,
        gridTemplateRows: `repeat(${cells.length}, minmax(18px, auto))`
      }}
      onMouseLeave={() => onHoverCell(null)}
    >
      {cells.flatMap((row, r) =>
        row.map((cell, c) => {
          // Occupied cells are covered by their anchor's span — don't render them.
          if (cell.occupiedByAnchor) return null;
          const { symbol, unknownImage, width: sw, height: sh } = resolveCell(cell);
          const low = cell.hash !== "empty" && !cell.overrideSymbolId && cell.confidence < threshold;
          const isSelected = selectedCell && selectedCell[0] === r && selectedCell[1] === c;
          return (
            <button
              key={`${r}-${c}`}
              type="button"
              onClick={() => onSelectCell(r, c)}
              onMouseEnter={() => onHoverCell([r, c])}
              title={`${r + 1},${c + 1}`}
              style={{
                gridColumn: sw > 1 ? `${c + 1} / span ${sw}` : c + 1,
                gridRow: sh > 1 ? `${r + 1} / span ${sh}` : r + 1,
                aspectRatio: sw === 1 && sh === 1 ? "1" : undefined
              }}
              className={`flex items-center justify-center bg-white ${
                low ? "ring-1 ring-inset ring-amber-400" : ""
              } ${isSelected ? "ring-2 ring-inset ring-yarn-terracotta" : ""}`}
            >
              {symbol?.imageData ? (
                <Image src={symbol.imageData} alt={symbol.label} width={18 * sw} height={18 * sh} className="h-full w-full object-contain" unoptimized />
              ) : unknownImage ? (
                <Image src={unknownImage} alt="?" width={18 * sw} height={18 * sh} className="h-full w-full object-contain" unoptimized />
              ) : (
                <span className="text-[10px] text-yarn-warm-gray">{symbol?.glyph ?? ""}</span>
              )}
            </button>
          );
        }).filter(Boolean)
      )}
    </div>
  );
}

function CellFixPanel({
  symbols,
  onPick,
  onClear,
  onClose
}: {
  symbols: PatternSymbol[];
  onPick: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2 rounded-xl border border-yarn-terracotta/40 bg-white p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-yarn-warm-gray">
          {t("editor.renameSymbol")}
        </span>
        <button type="button" onClick={onClose} className="text-yarn-warm-gray hover:text-yarn-charcoal">
          ✕
        </button>
      </div>
      <div className="flex max-h-40 flex-wrap gap-1.5 overflow-auto">
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-yarn-sand/60 bg-white px-2 py-1 text-[11px] text-yarn-warm-gray hover:border-yarn-terracotta/40"
        >
          ↺
        </button>
        {symbols.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onPick(s.id)}
            title={s.label}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-yarn-sand/60 bg-white hover:border-yarn-terracotta/50"
          >
            {s.imageData ? (
              <Image src={s.imageData} alt={s.label} width={20} height={20} className="object-contain" unoptimized />
            ) : (
              <span className="font-mono text-xs">{s.glyph}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function LegendPanel({
  glyphs,
  symbols,
  legendDetected,
  onRemap,
  symbolById
}: {
  glyphs: Record<string, ImportGlyph>;
  symbols: PatternSymbol[];
  legendDetected: boolean;
  onRemap: (hash: string, symbolId: string | null) => void;
  symbolById: (id: string) => PatternSymbol | undefined;
}) {
  const { t } = useTranslation();
  const list = Object.values(glyphs).filter((g) => g.hash !== "empty");
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-yarn-warm-gray">
        {t("import.legendTitle")}
      </p>
      {!legendDetected && (
        <p className="text-[11px] text-yarn-warm-gray/70">{t("import.legendNotDetected")}</p>
      )}
      <div className="space-y-1.5">
        {list.map((g) => {
          const mapped = g.mappedSymbolId ? symbolById(g.mappedSymbolId) : undefined;
          return (
            <div
              key={g.hash}
              className="flex items-center gap-2 rounded-lg border border-yarn-sand/40 bg-white p-2"
            >
              <Image src={g.image} alt="" width={28} height={28} className="rounded border border-yarn-sand/40 object-contain" unoptimized />
              <span className="text-yarn-warm-gray">→</span>
              <select
                value={g.mappedSymbolId ?? UNKNOWN_SELECT}
                onChange={(e) =>
                  onRemap(g.hash, e.target.value === UNKNOWN_SELECT ? null : e.target.value)
                }
                className="min-w-0 flex-1 rounded-lg border border-yarn-sand/60 bg-white px-2 py-1 text-xs text-yarn-charcoal focus:outline-none focus:border-yarn-terracotta"
              >
                <option value={UNKNOWN_SELECT}>{t("import.unknownBadge")}</option>
                {symbols.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <span className="shrink-0 text-[10px] text-yarn-warm-gray">
                {t("import.occurrences", { n: g.occurrences })}
              </span>
              {!mapped && (
                <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
                  ?
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UnknownPanel({
  glyphs,
  onRename
}: {
  glyphs: ImportGlyph[];
  onRename: (hash: string, name: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2 border-t border-yarn-sand/40 pt-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-yarn-warm-gray">
        {t("import.unknownTitle")}
      </p>
      <div className="space-y-1.5">
        {glyphs.map((g) => (
          <div key={g.hash} className="flex items-center gap-2 rounded-lg border border-yarn-sand/40 bg-white p-2">
            <Image src={g.image} alt="" width={36} height={36} className="rounded border border-yarn-sand/40 object-contain" unoptimized />
            <div className="min-w-0 flex-1">
              <input
                value={g.suggestedName}
                onChange={(e) => onRename(g.hash, e.target.value)}
                className="w-full border-b border-yarn-sand bg-transparent text-sm font-medium text-yarn-charcoal focus:border-yarn-terracotta focus:outline-none"
              />
              <span className="text-[10px] text-yarn-warm-gray">{t("import.occurrences", { n: g.occurrences })}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
