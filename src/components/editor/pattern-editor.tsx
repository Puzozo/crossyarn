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
    toastData,
    clearToast
  } = usePatternEditorStore();
  const { t } = useTranslation();
  const [saveState, setSaveState] = useState("saved");
  const [resizing, setResizing] = useState(false);
  const [draftWidth, setDraftWidth] = useState(0);
  const [draftHeight, setDraftHeight] = useState(0);
  const initializedRef = useRef(false);
  const [availableSymbols, setAvailableSymbols] = useState(initialPattern.symbols);

  // Auto-dismiss toast
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
    if (symbolsLoadedRef.current || !pattern) {
      return;
    }
    symbolsLoadedRef.current = true;
    void fetch("/api/symbols")
      .then((response) => response.json())
      .then((fetchedSymbols) => {
        if (Array.isArray(fetchedSymbols)) {
          setAvailableSymbols(fetchedSymbols);
          const fetchedIds = new Set(fetchedSymbols.map((s: { id: string }) => s.id));
          const documentOnly = (pattern?.symbols ?? []).filter((s) => !fetchedIds.has(s.id));
          setSymbols([...fetchedSymbols, ...documentOnly]);
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
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            id: patternId,
            title,
            description: description ?? "",
            width: documentToSave.width,
            height: documentToSave.height,
            patternData: documentToSave
          })
        });
        setSaveState(response.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
    },
    [description, patternId, title]
  );

  useEffect(() => {
    if (!pattern) {
      return;
    }
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }
    const timeout = setTimeout(() => {
      void handleSave(pattern);
    }, 1200);
    return () => clearTimeout(timeout);
  }, [handleSave, pattern]);

  if (!pattern) {
    return null;
  }

  const saveLabel =
    saveState === "saved"
      ? t("editor.saved")
      : saveState === "saving"
        ? t("editor.saving")
        : saveState === "autosaving"
          ? t("editor.autosaving")
          : t("editor.error");

  return (
    <div className="grid gap-4 lg:gap-6 lg:grid-cols-[300px,1fr]">
      {/* Sidebar - becomes horizontal toolbar on tablet */}
      <aside className="space-y-4 rounded-2xl bg-white/70 border border-yarn-sand/50 p-4 lg:p-5 shadow-warm-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-yarn-charcoal">{t("editor.tools")}</h2>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            saveState === "saved"
              ? "bg-yarn-sage-light text-yarn-sage"
              : saveState === "error"
                ? "bg-red-50 text-red-600"
                : "bg-yarn-terracotta-light text-yarn-terracotta"
          }`}>
            {saveLabel}
          </span>
        </div>

        {/* Grid info + resize */}
        {resizing ? (
          <div className="rounded-xl bg-yarn-oatmeal/60 p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-yarn-warm-gray">{t("editor.resize")}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-yarn-warm-gray">{t("editor.widthLabel")}</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={draftWidth}
                  onChange={(e) => setDraftWidth(Math.max(1, Math.min(200, Number(e.target.value))))}
                  className="w-full rounded-lg border border-yarn-sand bg-white px-2 py-1.5 text-sm font-mono text-yarn-charcoal focus:outline-none focus:border-yarn-terracotta"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-yarn-warm-gray">{t("editor.heightLabel")}</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={draftHeight}
                  onChange={(e) => setDraftHeight(Math.max(1, Math.min(200, Number(e.target.value))))}
                  className="w-full rounded-lg border border-yarn-sand bg-white px-2 py-1.5 text-sm font-mono text-yarn-charcoal focus:outline-none focus:border-yarn-terracotta"
                />
              </div>
            </div>
            {(draftWidth < pattern.width || draftHeight < pattern.height) && (
              <p className="text-[10px] text-amber-600">{t("editor.resizeWarning")}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { resizePattern(draftWidth, draftHeight); setResizing(false); }}
                className="flex-1 rounded-lg bg-yarn-terracotta text-white text-xs font-semibold py-1.5 hover:bg-yarn-terracotta-hover transition-colors"
              >
                {t("editor.resizeApply")}
              </button>
              <button
                type="button"
                onClick={() => setResizing(false)}
                className="flex-1 rounded-lg bg-yarn-sand/60 text-yarn-charcoal text-xs font-semibold py-1.5 hover:bg-yarn-sand transition-colors"
              >
                {t("editor.cancelEdit")}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setDraftWidth(pattern.width); setDraftHeight(pattern.height); setResizing(true); }}
            className="flex w-full items-center justify-between rounded-xl bg-yarn-oatmeal/60 p-3 text-sm text-yarn-charcoal font-mono hover:bg-yarn-oatmeal transition-colors"
          >
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
              <button
                key={symbol.id}
                type="button"
                onClick={() => setSelectedSymbolId(symbol.id)}
                className={`rounded-lg border px-2.5 py-1.5 text-sm transition-all duration-150 ${
                  selectedSymbolId === symbol.id
                    ? "border-yarn-terracotta bg-yarn-terracotta-light text-yarn-terracotta shadow-warm-sm"
                    : "border-yarn-sand/60 bg-white hover:border-yarn-terracotta/40 hover:bg-yarn-terracotta-light/30"
                }`}
                title={symbol.description}
              >
                <span className="flex items-center gap-1.5">
                  {symbol.imageData ? (
                    <Image src={symbol.imageData} alt={symbol.label} width={20} height={20} className="object-contain" />
                  ) : (
                    <span className="inline-flex min-w-5 justify-center font-mono">{symbol.glyph}</span>
                  )}
                  <span className="text-xs">{symbol.label}</span>
                  {(symbol.width ?? 1) > 1 && (
                    <span className="ml-0.5 rounded bg-yarn-sage-light px-1 py-0.5 text-[9px] font-bold text-yarn-sage">
                      ×{symbol.width}
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
              <button
                key={color.id}
                type="button"
                title={color.name}
                onClick={() => setSelectedColor(color.hex)}
                className={`h-9 w-9 rounded-full border-[3px] transition-all duration-150 hover:scale-110 ${
                  selectedColor === color.hex
                    ? "border-yarn-charcoal scale-110 shadow-warm"
                    : "border-white shadow-warm-sm"
                }`}
                style={{ backgroundColor: color.hex }}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-yarn-sand/40">
          <Button variant="secondary" size="sm" onClick={undo}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
              <path d="M3 5h6a3 3 0 0 1 0 6H7" />
              <path d="M5 3L3 5l2 2" />
            </svg>
            {t("editor.undo")}
          </Button>
          <Button variant="secondary" size="sm" onClick={redo}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5">
              <path d="M11 5H5a3 3 0 0 0 0 6h2" />
              <path d="M9 3l2 2-2 2" />
            </svg>
            {t("editor.redo")}
          </Button>
        </div>
      </aside>

      {/* Grid canvas */}
      <section className="overflow-auto rounded-2xl bg-white/70 border border-yarn-sand/50 p-3 sm:p-4 lg:p-5 shadow-warm-sm">
        <div
          className="grid gap-px bg-yarn-sand/60"
          style={{
            gridTemplateColumns: `repeat(${pattern.width}, minmax(22px, 1fr)) 36px`
          }}
        >
          {pattern.cells.flatMap((row, rowIndex) => [
            ...row.map((cell, columnIndex) => {
              // Skip cells occupied by a multi-cell symbol
              if (cell.occupiedByAnchor) {
                return null;
              }
              const symbol = availableSymbols.find((item) => item.id === cell.symbolId);
              const symbolWidth = symbol?.width ?? 1;
              return (
                <button
                  key={`${rowIndex}-${columnIndex}`}
                  type="button"
                  onClick={() => paintCell(rowIndex, columnIndex)}
                  className="flex min-h-7 items-center justify-center bg-white text-xs font-semibold text-yarn-charcoal hover:ring-1 hover:ring-yarn-terracotta/40 transition-shadow"
                  style={{
                    backgroundColor: cell.color,
                    gridColumn: symbolWidth > 1 ? `span ${symbolWidth}` : undefined,
                    aspectRatio: symbolWidth > 1 ? undefined : "1"
                  }}
                  title={t("editor.cellTitle", { row: String(pattern.height - rowIndex), col: String(pattern.width - columnIndex) }) + (symbolWidth > 1 ? ` (×${symbolWidth})` : "")}
                >
                  {(() => {
                    if (symbol?.imageData) {
                      return (
                        <Image
                          src={symbol.imageData}
                          alt={symbol.label}
                          width={18 * symbolWidth}
                          height={18}
                          className="object-contain"
                        />
                      );
                    }
                    return symbol?.glyph ?? "·";
                  })()}
                </button>
              );
            }).filter(Boolean),
            <div
              key={`row-${rowIndex}`}
              className="flex min-h-7 items-center justify-center bg-yarn-oatmeal text-[10px] font-mono font-semibold text-yarn-warm-gray"
            >
              {pattern.height - rowIndex}
            </div>
          ])}
          {Array.from({ length: pattern.width }, (_, columnIndex) => (
            <div
              key={`column-${columnIndex}`}
              className="flex min-h-7 items-center justify-center bg-yarn-oatmeal text-[10px] font-mono font-semibold text-yarn-warm-gray"
            >
              {pattern.width - columnIndex}
            </div>
          ))}
          <div className="bg-yarn-oatmeal rounded-br" />
        </div>
      </section>

      {/* Toast notification */}
      {toastData && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-yarn-charcoal text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-medium animate-fade-in flex items-center gap-3">
          <span>{t(toastData.key as TranslationKey, toastData.params)}</span>
          <button onClick={clearToast} className="text-white/70 hover:text-white text-lg leading-none">&times;</button>
        </div>
      )}
    </div>
  );
}
