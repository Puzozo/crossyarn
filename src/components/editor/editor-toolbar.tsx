"use client";

import Image from "next/image";
import { PatternPaletteColor, PatternSymbol } from "@/lib/patterns/model";
import { useTranslation } from "@/lib/i18n/context";

export type SaveState = "saved" | "saving" | "autosaving" | "error";

type Props = {
  symbols: PatternSymbol[];
  selectedSymbolId: string;
  onSelectSymbol: (id: string) => void;
  palette: PatternPaletteColor[];
  selectedColor: string;
  onSelectColor: (hex: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  isFillMode: boolean;
  onToggleFill: () => void;
  saveState: SaveState;
  saveLabel: string;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onZoomFit: () => void;
};

const iconButtonClass =
  "flex h-10 min-w-10 items-center justify-center rounded-lg border border-yarn-sand/60 bg-white px-2 text-sm font-semibold text-yarn-charcoal hover:bg-yarn-oatmeal transition-colors";

export function EditorToolbar({
  symbols,
  selectedSymbolId,
  onSelectSymbol,
  palette,
  selectedColor,
  onSelectColor,
  onUndo,
  onRedo,
  isFillMode,
  onToggleFill,
  saveState,
  saveLabel,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomFit
}: Props) {
  const { t } = useTranslation();

  const saveBadgeClass =
    saveState === "saved"
      ? "bg-yarn-sage-light text-yarn-sage"
      : saveState === "error"
        ? "bg-red-50 text-red-600"
        : "bg-yarn-terracotta-light text-yarn-terracotta";

  return (
    <div className="sticky top-2 z-20 space-y-2 rounded-2xl border border-yarn-sand/60 bg-white/95 p-2 shadow-warm-sm backdrop-blur">
      {/* Row 1: undo/redo, fill, zoom, save state */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={onUndo} title={t("editor.undo") + " (Ctrl+Z)"} aria-label={t("editor.undo")} className={iconButtonClass}>
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 5h6a3 3 0 0 1 0 6H7" /><path d="M5 3L3 5l2 2" />
          </svg>
        </button>
        <button type="button" onClick={onRedo} title={t("editor.redo") + " (Ctrl+Y)"} aria-label={t("editor.redo")} className={iconButtonClass}>
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M11 5H5a3 3 0 0 0 0 6h2" /><path d="M9 3l2 2-2 2" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onToggleFill}
          aria-pressed={isFillMode}
          title={t("editor.fillMode") + " (F)"}
          aria-label={t("editor.fillMode")}
          className={
            isFillMode
              ? "flex h-10 min-w-10 items-center justify-center rounded-lg border border-yarn-terracotta/40 bg-yarn-terracotta-light px-2 text-sm font-semibold text-yarn-terracotta hover:bg-yarn-oatmeal transition-colors"
              : iconButtonClass
          }
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z" />
            <path d="m5 2 5 5" />
            <path d="M2 13h15" />
            <path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z" />
          </svg>
        </button>

        <span className="mx-1 h-6 w-px bg-yarn-sand/70" aria-hidden />

        <button type="button" onClick={onZoomOut} title={t("editor.zoomOut")} aria-label={t("editor.zoomOut")} className={iconButtonClass}>
          −
        </button>
        <button type="button" onClick={onZoomReset} title={t("editor.zoomReset")} aria-label={t("editor.zoomReset")} className={iconButtonClass}>
          {Math.round(zoomLevel * 100)}%
        </button>
        <button type="button" onClick={onZoomIn} title={t("editor.zoomIn")} aria-label={t("editor.zoomIn")} className={iconButtonClass}>
          +
        </button>
        <button type="button" onClick={onZoomFit} title={t("editor.zoomFitHint")} aria-label={t("editor.zoomFit")} className={iconButtonClass}>
          {t("editor.zoomFit")}
        </button>

        <span role="status" aria-live="polite" className={"ml-auto rounded-full px-2 py-1 text-xs font-medium " + saveBadgeClass}>
          {saveLabel}
        </span>
      </div>

      {/* Row 2: symbols strip + palette */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {symbols.map((s) => {
          const selected = s.id === selectedSymbolId;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectSymbol(s.id)}
              aria-pressed={selected}
              aria-label={s.label}
              title={s.description ?? s.label}
              className={
                "flex h-10 min-w-10 shrink-0 items-center justify-center rounded-lg border px-1.5 transition-colors " +
                (selected
                  ? "border-yarn-terracotta bg-yarn-terracotta-light ring-2 ring-yarn-terracotta/30"
                  : "border-yarn-sand/60 bg-white hover:border-yarn-terracotta/40")
              }
            >
              {s.imageData ? (
                <Image src={s.imageData} alt="" width={24} height={24} className="object-contain" />
              ) : (
                <span className="font-mono text-sm">{s.glyph ?? "·"}</span>
              )}
            </button>
          );
        })}

        <span className="mx-1 h-6 w-px shrink-0 bg-yarn-sand/70" aria-hidden />

        {palette.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelectColor(c.hex)}
            aria-pressed={selectedColor === c.hex}
            aria-label={c.name}
            title={c.name}
            className={
              "h-8 w-8 shrink-0 rounded-full border-[3px] transition-transform " +
              (selectedColor === c.hex ? "border-yarn-charcoal scale-110" : "border-white shadow-warm-sm")
            }
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>
    </div>
  );
}