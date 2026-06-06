"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PatternDocument } from "@/lib/patterns/model";
import { usePatternEditorStore } from "@/lib/patterns/editor-state";
import { useTranslation } from "@/lib/i18n/context";
import { TranslationKey } from "@/lib/i18n/translations";

type Props = {
  patternId: string;
  initialPattern: PatternDocument;
  title: string;
  description: string | null;
};

function inSelectionRect(
  r: number,
  c: number,
  start: [number, number] | null,
  end: [number, number] | null
): boolean {
  if (!start || !end) return false;
  const r1 = Math.min(start[0], end[0]);
  const r2 = Math.max(start[0], end[0]);
  const c1 = Math.min(start[1], end[1]);
  const c2 = Math.max(start[1], end[1]);
  return r >= r1 && r <= r2 && c >= c1 && c <= c2;
}

export function PatternEditor({ patternId, initialPattern, title, description }: Props) {
  const {
    pattern,
    setPattern,
    paintCell,
    undo,
    redo,
    selectedColor,
    selectedSymbolId,
    setSelectedColor,
    setSelectedSymbolId,
    setSymbols,
    resizePattern,
    addEdge,
    toastData,
    clearToast,
    isSelectionMode,
    isSelecting,
    selectionStart,
    selectionEnd,
    rapportInsertId,
    toggleSelectionMode,
    startSelection,
    updateSelection,
    endSelection,
    saveSelectionAsRapport,
    deleteRapport,
    startRapportInsert,
    cancelRapportInsert,
    insertRapport
  } = usePatternEditorStore();
  const { t } = useTranslation();
  const [saveState, setSaveState] = useState("saved");
  const [resizing, setResizing] = useState(false);
  const [draftWidth, setDraftWidth] = useState(0);
  const [draftHeight, setDraftHeight] = useState(0);
  const initializedRef = useRef(false);
  const [availableSymbols, setAvailableSymbols] = useState(initialPattern.symbols);
  const [rapportNameInput, setRapportNameInput] = useState("");

  useEffect(() => {
    if (toastData) {
      const timer = setTimeout(clearToast, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastData, clearToast]);

  useEffect(() => {
    setPattern(initialPattern);
  }, [initialPattern, setPattern]);

  const symbolsLoadedRef = useRef(false);
  useEffect(() => {
    if (symbolsLoadedRef.current || !pattern) return;
    symbolsLoadedRef.current = true;
    void fetch("/api/symbols")
      .then((r) => r.json())
      .then((fetched) => {
        if (Array.isArray(fetched)) {
          setAvailableSymbols(fetched);
          const fetchedIds = new Set(fetched.map((s: { id: string }) => s.id));
          const documentOnly = (pattern?.symbols ?? []).filter((s) => !fetchedIds.has(s.id));
          setSymbols([...fetched, ...documentOnly]);
        }
      })
      .catch(() => undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern, setSymbols]);

  const handleSave = useCallback(
    async (documentToSave: PatternDocument) => {
      setSaveState("autosaving");
      try {
        const response = await fetch(`/api/patterns/${patternId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: patternId, title, description: description ?? "", width: documentToSave.width, height: documentToSave.height, patternData: documentToSave })
        });
        setSaveState(response.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
    },
    [description, patternId, title]
  );

  useEffect(() => {
    if (!pattern) return;
    if (!initializedRef.current) { initializedRef.current = true; return; }
    const timeout = setTimeout(() => { void handleSave(pattern); }, 1200);
    return () => clearTimeout(timeout);
  }, [handleSave, pattern]);

  if (!pattern) return null;

  const saveLabel =
    saveState === "saved" ? t("editor.saved")
    : saveState === "saving" ? t("editor.saving")
    : saveState === "autosaving" ? t("editor.autosaving")
    : t("editor.error");

  const rapports = pattern.rapports ?? [];
  const activeRapport = rapports.find((r) => r.id === rapportInsertId) ?? null;
  const hasSelection = selectionStart !== null && selectionEnd !== null && !isSelecting;

  return (
    <div className="grid gap-4 lg:gap-6 lg:grid-cols-[300px,1fr]">
      {/* Sidebar */}
      <aside className="space-y-4 rounded-2xl bg-white/70 border border-yarn-sand/50 p-4 lg:p-5 shadow-warm-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-yarn-charcoal">{t("editor.tools")}</h2>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            saveState === "saved" ? "bg-yarn-sage-light text-yarn-sage"
            : saveState === "error" ? "bg-red-50 text-red-600"
            : "bg-yarn-terracotta-light text-yarn-terracotta"
          }`}>{saveLabel}</span>
        </div>

        {/* Grid size / resize */}
        {resizing ? (
          <div className="rounded-xl bg-yarn-oatmeal/60 p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-yarn-warm-gray">{t("editor.resize")}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-yarn-warm-gray">{t("editor.widthLabel")}</label>
                <input type="number" min={1} max={200} value={draftWidth}
                  onChange={(e) => setDraftWidth(Math.max(1, Math.min(200, Number(e.target.value))))}
                  className="w-full rounded-lg border border-yarn-sand bg-white px-2 py-1.5 text-sm font-mono text-yarn-charcoal focus:outline-none focus:border-yarn-terracotta" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-yarn-warm-gray">{t("editor.heightLabel")}</label>
                <input type="number" min={1} max={200} value={draftHeight}
                  onChange={(e) => setDraftHeight(Math.max(1, Math.min(200, Number(e.target.value))))}
                  className="w-full rounded-lg border border-yarn-sand bg-white px-2 py-1.5 text-sm font-mono text-yarn-charcoal focus:outline-none focus:border-yarn-terracotta" />
              </div>
            </div>
            {(draftWidth < pattern.width || draftHeight < pattern.height) && (
              <p className="text-[10px] text-amber-600">{t("editor.resizeWarning")}</p>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => { resizePattern(draftWidth, draftHeight); setResizing(false); }}
                className="flex-1 rounded-lg bg-yarn-terracotta text-white text-xs font-semibold py-1.5 hover:bg-yarn-terracotta-hover transition-colors">
                {t("editor.resizeApply")}
              </button>
              <button type="button" onClick={() => setResizing(false)}
                className="flex-1 rounded-lg bg-yarn-sand/60 text-yarn-charcoal text-xs font-semibold py-1.5 hover:bg-yarn-sand transition-colors">
                {t("editor.cancelEdit")}
              </button>
            </div>
          </div>
        ) : (
          <button type="button"
            onClick={() => { setDraftWidth(pattern.width); setDraftHeight(pattern.height); setResizing(true); }}
            className="flex w-full items-center justify-between rounded-xl bg-yarn-oatmeal/60 p-3 text-sm text-yarn-charcoal font-mono hover:bg-yarn-oatmeal transition-colors">
            <span>{t("editor.stitches")}: {pattern.width}</span>
            <span className="text-yarn-sand">|</span>
            <span>{t("editor.rows")}: {pattern.height}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="ml-1 text-yarn-warm-gray">
              <path d="M1 1h4M1 1v4M11 11H7M11 11V7" />
            </svg>
          </button>
        )}

        {/* Symbols */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-yarn-warm-gray">{t("editor.symbols")}</p>
          <div className="flex max-h-56 lg:max-h-80 flex-wrap gap-1.5 overflow-auto">
            {availableSymbols.map((symbol) => (
              <button key={symbol.id} type="button" onClick={() => setSelectedSymbolId(symbol.id)}
                className={`rounded-lg border px-2.5 py-1.5 text-sm transition-all duration-150 ${
                  selectedSymbolId === symbol.id
                    ? "border-yarn-terracotta bg-yarn-terracotta-light text-yarn-terracotta shadow-warm-sm"
                    : "border-yarn-sand/60 bg-white hover:border-yarn-terracotta/40 hover:bg-yarn-terracotta-light/30"
                }`}
                title={symbol.description}>
                <span className="flex items-center gap-1.5">
                  {symbol.imageData ? (
                    <Image src={symbol.imageData} alt={symbol.label} width={20} height={20} className="object-contain" />
                  ) : (
                    <span className="inline-flex min-w-5 justify-center font-mono">{symbol.glyph}</span>
                  )}
                  <span className="text-xs">{symbol.label}</span>
                  {((symbol.width ?? 1) > 1 || (symbol.height ?? 1) > 1) && (
                    <span className="ml-0.5 rounded bg-yarn-sage-light px-1 py-0.5 text-[9px] font-bold text-yarn-sage">
                      {symbol.width ?? 1}×{symbol.height ?? 1}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Palette */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-yarn-warm-gray">{t("editor.palette")}</p>
          <div className="flex flex-wrap gap-2">
            {pattern.palette.map((color) => (
              <button key={color.id} type="button" title={color.name} onClick={() => setSelectedColor(color.hex)}
                className={`h-9 w-9 rounded-full border-[3px] transition-all duration-150 hover:scale-110 ${
                  selectedColor === color.hex ? "border-yarn-charcoal scale-110 shadow-warm" : "border-white shadow-warm-sm"
                }`}
                style={{ backgroundColor: color.hex }} />
            ))}
          </div>
        </div>

        {/* ── Rapports ── */}
        <div className="space-y-2 border-t border-yarn-sand/40 pt-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-yarn-warm-gray">Рапорти</p>
            <button type="button" onClick={toggleSelectionMode}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                isSelectionMode
                  ? "bg-blue-100 border-blue-300 text-blue-700"
                  : "bg-yarn-oatmeal/60 border-transparent text-yarn-charcoal hover:bg-yarn-oatmeal"
              }`}>
              {isSelectionMode ? "✕ Скасувати" : "⬚ Виділити"}
            </button>
          </div>

          {/* Save form (shown after selection is drawn) */}
          {hasSelection && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-2 space-y-2">
              <p className="text-[10px] text-blue-600 font-medium">
                Виділено: {Math.abs(selectionEnd![1] - selectionStart![1]) + 1}×{Math.abs(selectionEnd![0] - selectionStart![0]) + 1} клітинок
              </p>
              <div className="flex gap-1">
                <input value={rapportNameInput} onChange={(e) => setRapportNameInput(e.target.value)}
                  placeholder="Назва рапорту"
                  className="flex-1 rounded border border-blue-200 bg-white px-2 py-1 text-xs text-yarn-charcoal focus:outline-none focus:border-blue-400"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && rapportNameInput.trim()) {
                      saveSelectionAsRapport(rapportNameInput.trim());
                      setRapportNameInput("");
                    }
                  }}
                />
                <button type="button" disabled={!rapportNameInput.trim()}
                  onClick={() => { saveSelectionAsRapport(rapportNameInput.trim()); setRapportNameInput(""); }}
                  className="px-2 py-1 rounded bg-blue-500 text-white text-xs font-medium disabled:opacity-40 hover:bg-blue-600 transition-colors">
                  Зберегти
                </button>
              </div>
            </div>
          )}

          {/* Insert mode panel */}
          {rapportInsertId && activeRapport && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-amber-800">{activeRapport.name}</span>
                  <span className="text-[10px] text-amber-600 ml-1.5">{activeRapport.width}×{activeRapport.height}</span>
                </div>
                <button type="button" onClick={cancelRapportInsert}
                  className="text-[10px] text-amber-600 hover:text-amber-800 transition-colors">✕</button>
              </div>
              <p className="text-[10px] text-amber-700">
                Клікніть на схемі щоб вставити. Якщо не вміщується — автоматично обріжеться по межі.
              </p>
            </div>
          )}

          {/* Rapport list */}
          {rapports.length > 0 && (
            <div className="space-y-1">
              {rapports.map((rapport) => (
                <div key={rapport.id}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${
                    rapportInsertId === rapport.id ? "border-amber-400 bg-amber-50" : "border-yarn-sand/60 bg-white"
                  }`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-yarn-charcoal truncate">{rapport.name}</div>
                    <div className="text-[10px] text-yarn-warm-gray">{rapport.width}×{rapport.height}</div>
                  </div>
                  <button type="button"
                    onClick={() => rapportInsertId === rapport.id ? cancelRapportInsert() : startRapportInsert(rapport.id)}
                    className={`text-xs px-2 py-0.5 rounded transition-colors shrink-0 ${
                      rapportInsertId === rapport.id
                        ? "bg-amber-200 text-amber-800 hover:bg-amber-300"
                        : "bg-yarn-sage-light text-yarn-sage hover:bg-yarn-sage/20"
                    }`}>
                    {rapportInsertId === rapport.id ? "Скасувати" : "Вставити"}
                  </button>
                  <button type="button" onClick={() => deleteRapport(rapport.id)}
                    className="text-yarn-warm-gray/40 hover:text-red-400 transition-colors text-sm leading-none shrink-0">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {rapports.length === 0 && !isSelectionMode && (
            <p className="text-[11px] text-yarn-warm-gray/70">
              Натисніть «Виділити», обведіть ділянку на схемі та збережіть як рапорт.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-yarn-sand/40">
          <Button variant="secondary" size="sm" onClick={undo}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
              <path d="M3 5h6a3 3 0 0 1 0 6H7" /><path d="M5 3L3 5l2 2" />
            </svg>
            {t("editor.undo")}
          </Button>
          <Button variant="secondary" size="sm" onClick={redo}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
              <path d="M11 5H5a3 3 0 0 0 0 6h2" /><path d="M9 3l2 2-2 2" />
            </svg>
            {t("editor.redo")}
          </Button>
        </div>
      </aside>

      {/* Grid canvas */}
      <section className="overflow-auto rounded-2xl bg-white/70 border border-yarn-sand/50 p-3 sm:p-4 lg:p-5 shadow-warm-sm">
        {/* Add row top */}
        <div className="flex justify-center mb-1">
          <button type="button" onClick={() => addEdge("top")} title="Додати рядок зверху"
            className="flex items-center gap-1 rounded-full border border-dashed border-yarn-sand/70 bg-yarn-oatmeal/40 px-4 py-0.5 text-xs font-bold text-yarn-warm-gray hover:border-yarn-terracotta/50 hover:bg-yarn-terracotta-light/40 hover:text-yarn-terracotta transition-colors">
            <span>+</span>
          </button>
        </div>

        <div className="flex gap-1 items-stretch">
          {/* Add col left */}
          <button type="button" onClick={() => addEdge("left")} title="Додати стовпець ліворуч"
            className="flex items-center justify-center rounded-full border border-dashed border-yarn-sand/70 bg-yarn-oatmeal/40 w-6 shrink-0 text-xs font-bold text-yarn-warm-gray hover:border-yarn-terracotta/50 hover:bg-yarn-terracotta-light/40 hover:text-yarn-terracotta transition-colors">
            +
          </button>

          <div
            className="grid gap-px bg-yarn-sand/60 flex-1"
            style={{
              gridTemplateColumns: `repeat(${pattern.width}, minmax(40px, 1fr)) 40px`,
              gridTemplateRows: `repeat(${pattern.height}, minmax(40px, auto)) 40px`
            }}
            onPointerUp={() => { if (isSelectionMode && isSelecting) endSelection(); }}
          >
            {pattern.cells.flatMap((row, rowIndex) => [
              ...row.map((cell, columnIndex) => {
                if (cell.occupiedByAnchor) return null;
                const symbol = availableSymbols.find((item) => item.id === cell.symbolId);
                const sw = symbol?.width ?? 1;
                const sh = symbol?.height ?? 1;
                const selected = inSelectionRect(rowIndex, columnIndex, selectionStart, selectionEnd);

                return (
                  <button
                    key={`${rowIndex}-${columnIndex}`}
                    type="button"
                    data-row={rowIndex}
                    data-col={columnIndex}
                    onClick={() => {
                      if (isSelectionMode) return;
                      if (rapportInsertId) { insertRapport(rowIndex, columnIndex); return; }
                      paintCell(rowIndex, columnIndex);
                    }}
                    onPointerDown={(e) => {
                      if (!isSelectionMode) return;
                      e.preventDefault();
                      startSelection(rowIndex, columnIndex);
                    }}
                    onPointerEnter={() => {
                      if (!isSelectionMode || !isSelecting) return;
                      updateSelection(rowIndex, columnIndex);
                    }}
                    className={[
                      "flex items-center justify-center text-xs font-semibold text-yarn-charcoal transition-shadow relative",
                      isSelectionMode ? "cursor-crosshair" : rapportInsertId ? "cursor-crosshair hover:ring-2 hover:ring-amber-400/70" : "hover:ring-1 hover:ring-yarn-terracotta/40",
                      selected ? "ring-2 ring-inset ring-blue-500" : ""
                    ].join(" ")}
                    style={{
                      backgroundColor: cell.color,
                      gridRow: sh > 1 ? `${rowIndex + 1} / span ${sh}` : rowIndex + 1,
                      gridColumn: sw > 1 ? `${columnIndex + 1} / span ${sw}` : columnIndex + 1,
                      aspectRatio: sw === 1 && sh === 1 ? "1" : undefined,
                      minHeight: "40px"
                    }}
                    title={`${t("editor.cellTitle", { row: String(pattern.height - rowIndex), col: String(pattern.width - columnIndex) })}${sw > 1 || sh > 1 ? ` (${sw}×${sh})` : ""}`}
                  >
                    {selected && (
                      <div className="absolute inset-0 bg-blue-400/20 pointer-events-none" />
                    )}
                    {symbol?.imageData ? (
                      <Image src={symbol.imageData} alt={symbol.label} width={40 * sw} height={40 * sh} className="object-contain w-full h-full relative z-10" />
                    ) : (
                      <span className="relative z-10">{symbol?.glyph ?? "·"}</span>
                    )}
                  </button>
                );
              }).filter(Boolean),
              <div key={`row-${rowIndex}`}
                className="flex items-center justify-center bg-yarn-oatmeal text-[10px] font-mono font-semibold text-yarn-warm-gray"
                style={{ gridRow: rowIndex + 1, gridColumn: pattern.width + 1, minHeight: "40px" }}>
                {pattern.height - rowIndex}
              </div>
            ])}
            {Array.from({ length: pattern.width }, (_, columnIndex) => (
              <div key={`column-${columnIndex}`}
                className="flex items-center justify-center bg-yarn-oatmeal text-[10px] font-mono font-semibold text-yarn-warm-gray"
                style={{ gridRow: pattern.height + 1, gridColumn: columnIndex + 1, minHeight: "40px" }}>
                {pattern.width - columnIndex}
              </div>
            ))}
            <div className="bg-yarn-oatmeal rounded-br" style={{ gridRow: pattern.height + 1, gridColumn: pattern.width + 1 }} />
          </div>

          {/* Add col right */}
          <button type="button" onClick={() => addEdge("right")} title="Додати стовпець праворуч"
            className="flex items-center justify-center rounded-full border border-dashed border-yarn-sand/70 bg-yarn-oatmeal/40 w-6 shrink-0 text-xs font-bold text-yarn-warm-gray hover:border-yarn-terracotta/50 hover:bg-yarn-terracotta-light/40 hover:text-yarn-terracotta transition-colors">
            +
          </button>
        </div>

        {/* Add row bottom */}
        <div className="flex justify-center mt-1">
          <button type="button" onClick={() => addEdge("bottom")} title="Додати рядок знизу"
            className="flex items-center gap-1 rounded-full border border-dashed border-yarn-sand/70 bg-yarn-oatmeal/40 px-4 py-0.5 text-xs font-bold text-yarn-warm-gray hover:border-yarn-terracotta/50 hover:bg-yarn-terracotta-light/40 hover:text-yarn-terracotta transition-colors">
            <span>+</span>
          </button>
        </div>
      </section>

      {/* Toast */}
      {toastData && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-yarn-charcoal text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-medium animate-fade-in flex items-center gap-3">
          <span>{t(toastData.key as TranslationKey, toastData.params)}</span>
          <button onClick={clearToast} className="text-white/70 hover:text-white text-lg leading-none">&times;</button>
        </div>
      )}
    </div>
  );
}
