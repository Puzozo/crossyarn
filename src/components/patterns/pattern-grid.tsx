"use client";

import { useId } from "react";
import { PatternDocument } from "@/lib/patterns/model";
import { isSafeImageDataUri } from "@/lib/patterns/image-data";

/**
 * Read-only render of a pattern grid. Extracted from PrintContent so the print
 * page and the public pattern page share one implementation of the (subtle)
 * skip-purl row projection + multi-cell colspan logic.
 *
 * `print:` utility classes are kept so the print page renders identically; they
 * are inert on screen (public page).
 */
export function PatternGrid({
  document,
  highlightRow,
  onRowClick
}: {
  document: PatternDocument;
  highlightRow?: number; // row number as shown on the scheme (document.height - rowIndex)
  onRowClick?: (rowNumber: number) => void;
}) {
  const skipPurl = document.view.skipPurlRows ?? false;

  // Grid lines are drawn as per-cell top/left borders (a border always rounds
  // to exactly one device pixel) instead of a gap-bleed background. With
  // fractional 1fr track widths on narrow screens the old 1px gap rounded to
  // 1–2 device pixels unevenly, which showed up as pale "white stripes".
  // Only top/left borders (and only when not on the first row/column) so lines
  // never double up and no outer frame is added — matching the gap look.
  const line = "border-yarn-sand/60 print:border-gray-300";

  // Each symbol image goes into one CSS rule and cells reference it by class.
  // Inlining the data URI per cell made a 300KB image × 40k cells ≈ GBs of HTML
  // (anonymous DoS via /p/[id]). Only validated base64 data URIs are emitted,
  // so the value can't break out of url("…").
  const classPrefix = `cy${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const imageClassBySymbolId = new Map<string, string>();
  const imageRules: string[] = [];
  for (const symbol of document.symbols) {
    if (!isSafeImageDataUri(symbol.imageData) || imageClassBySymbolId.has(symbol.id)) continue;
    const className = `${classPrefix}-${imageClassBySymbolId.size}`;
    imageClassBySymbolId.set(symbol.id, className);
    imageRules.push(`.${className}{background-image:url("${symbol.imageData}")}`);
  }
  const visibleRowIndexes = Array.from({ length: document.height }, (_, i) => i).filter(
    (i) => !skipPurl || (document.height - i) % 2 === 1
  );

  return (
    <div
      className="grid"
      style={{
        // Symbols and cell colours are backgrounds; keep them when printing.
        printColorAdjust: "exact",
        WebkitPrintColorAdjust: "exact",
        gridTemplateColumns: `repeat(${document.width}, minmax(16px, 1fr)) 32px`,
        gridTemplateRows: `repeat(${visibleRowIndexes.length}, minmax(16px, auto))`
      }}
    >
      {imageRules.length > 0 ? <style>{imageRules.join("")}</style> : null}
      {visibleRowIndexes.flatMap((rowIndex, displayIdx) => [
        ...document.cells[rowIndex].map((cell, columnIndex) => {
          // In skip mode vertical spans collapse; a symbol anchored in a hidden
          // row is projected onto its first visible row so it doesn't vanish
          let displaySymbolId = cell.symbolId;
          if (cell.occupiedByAnchor) {
            if (!skipPurl || cell.occupiedByAnchor[0] === rowIndex) return null;
            const [ar, ac] = cell.occupiedByAnchor;
            const anchorHidden = (document.height - ar) % 2 === 0;
            if (anchorHidden && rowIndex === ar + 1) {
              const anchorCell = document.cells[ar]?.[ac];
              const anchorWidth = anchorCell
                ? document.symbols.find((s) => s.id === anchorCell.symbolId)?.width ?? 1
                : 1;
              if (columnIndex === ac && anchorCell) {
                displaySymbolId = anchorCell.symbolId;
              } else if (columnIndex < ac + anchorWidth) {
                return null; // covered by the projected anchor's colspan
              }
            }
          }
          const symbol = document.symbols.find((item) => item.id === displaySymbolId);
          const w = symbol?.width ?? 1;
          const h = skipPurl ? 1 : symbol?.height ?? 1;
          const imageClass = imageClassBySymbolId.get(displaySymbolId);
          return (
            <div
              key={`${rowIndex}-${columnIndex}`}
              className={`flex items-center justify-center bg-white text-[10px] font-semibold text-yarn-charcoal print:text-black${
                imageClass ? ` bg-contain bg-center bg-no-repeat ${imageClass}` : ""
              }${columnIndex > 0 ? ` border-l ${line}` : ""}${displayIdx > 0 ? ` border-t ${line}` : ""}`}
              role={imageClass ? "img" : undefined}
              aria-label={imageClass ? symbol?.label : undefined}
              style={{
                gridColumn: `${columnIndex + 1} / span ${w}`,
                gridRow: `${displayIdx + 1} / span ${h}`,
                backgroundColor: cell.color,
                aspectRatio: w === 1 && h === 1 ? "1" : undefined,
                opacity:
                  highlightRow !== undefined && document.height - rowIndex < highlightRow
                    ? 0.35
                    : undefined
              }}
            >
              {imageClass ? null : symbol?.glyph ?? "·"}
            </div>
          );
        }),
        ...(highlightRow !== undefined && document.height - rowIndex === highlightRow
          ? [
              <div
                key={`row-hl-${rowIndex}`}
                aria-hidden
                data-knit-current-row
                className="pointer-events-none z-10 rounded-sm ring-2 ring-yarn-terracotta print:hidden"
                style={{ gridColumn: `1 / span ${document.width}`, gridRow: displayIdx + 1 }}
              />
            ]
          : []),
        (() => {
          const rowNumber = document.height - rowIndex;
          const isCurrent = rowNumber === highlightRow;
          const className = `flex min-h-4 items-center justify-center print:bg-gray-100 text-[10px] font-mono font-semibold print:text-gray-600 border-l ${line}${displayIdx > 0 ? ` border-t ${line}` : ""} ${
            isCurrent ? "bg-yarn-terracotta text-white" : "bg-yarn-oatmeal text-yarn-warm-gray"
          }`;
          const style = { gridColumn: document.width + 1, gridRow: displayIdx + 1 };
          return onRowClick ? (
            <button
              key={`row-num-${rowIndex}`}
              type="button"
              className={`${className} cursor-pointer${isCurrent ? "" : " hover:bg-yarn-sand"}`}
              onClick={() => onRowClick(rowNumber)}
              style={style}
            >
              {rowNumber}
            </button>
          ) : (
            <div key={`row-num-${rowIndex}`} className={className} style={style}>
              {rowNumber}
            </div>
          );
        })()
      ])}
      {Array.from({ length: document.width }, (_, columnIndex) => (
        <div
          key={`col-num-${columnIndex}`}
          className={`flex min-h-4 items-center justify-center bg-yarn-oatmeal print:bg-gray-100 text-[10px] font-mono font-semibold text-yarn-warm-gray print:text-gray-600 border-t ${line}${columnIndex > 0 ? ` border-l ${line}` : ""}`}
          style={{ gridColumn: columnIndex + 1, gridRow: visibleRowIndexes.length + 1 }}
        >
          {document.width - columnIndex}
        </div>
      ))}
      <div
        className={`bg-yarn-oatmeal print:bg-gray-100 border-l border-t ${line}`}
        style={{ gridColumn: document.width + 1, gridRow: visibleRowIndexes.length + 1 }}
      />
    </div>
  );
}
