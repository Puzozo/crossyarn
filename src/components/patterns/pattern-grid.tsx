"use client";

import Image from "next/image";
import { PatternDocument } from "@/lib/patterns/model";

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
  const visibleRowIndexes = Array.from({ length: document.height }, (_, i) => i).filter(
    (i) => !skipPurl || (document.height - i) % 2 === 1
  );

  return (
    <div
      className="grid gap-px bg-yarn-sand/60 print:bg-gray-300"
      style={{
        gridTemplateColumns: `repeat(${document.width}, minmax(16px, 1fr)) 32px`,
        gridTemplateRows: `repeat(${visibleRowIndexes.length}, minmax(16px, auto))`
      }}
    >
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
          return (
            <div
              key={`${rowIndex}-${columnIndex}`}
              className="flex items-center justify-center bg-white text-[10px] font-semibold text-yarn-charcoal print:text-black"
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
              {symbol?.imageData ? (
                <Image
                  src={symbol.imageData}
                  alt={symbol.label}
                  width={16 * w}
                  height={16 * h}
                  className="object-contain w-full h-full"
                />
              ) : (
                symbol?.glyph ?? "·"
              )}
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
          const className = `flex min-h-4 items-center justify-center print:bg-gray-100 text-[10px] font-mono font-semibold print:text-gray-600 ${
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
          className="flex min-h-4 items-center justify-center bg-yarn-oatmeal print:bg-gray-100 text-[10px] font-mono font-semibold text-yarn-warm-gray print:text-gray-600"
          style={{ gridColumn: columnIndex + 1, gridRow: visibleRowIndexes.length + 1 }}
        >
          {document.width - columnIndex}
        </div>
      ))}
      <div
        className="bg-yarn-oatmeal print:bg-gray-100"
        style={{ gridColumn: document.width + 1, gridRow: visibleRowIndexes.length + 1 }}
      />
    </div>
  );
}
