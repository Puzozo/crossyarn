"use client";

import Image from "next/image";
import Link from "next/link";
import { PrintButton } from "@/components/patterns/print-button";
import { PdfDownloadButton } from "@/components/patterns/pdf-download-button";
import { useTranslation } from "@/lib/i18n/context";
import { PatternDocument, PatternSymbol } from "@/lib/patterns/model";

type Props = {
  pattern: {
    id: string;
    title: string;
    width: number;
    height: number;
    updatedAt: string;
  };
  document: PatternDocument;
  usedSymbols: PatternSymbol[];
};

export function PrintContent({ pattern, document, usedSymbols }: Props) {
  const { t } = useTranslation();

  // When skipPurlRows is on, only odd-numbered rows are shown (row number = height - rowIndex)
  const skipPurl = document.view.skipPurlRows ?? false;
  const visibleRowIndexes = Array.from({ length: document.height }, (_, i) => i)
    .filter((i) => !skipPurl || (document.height - i) % 2 === 1);

  return (
    <section className="space-y-6 print:p-4">
      {/* Screen-only header */}
      <div className="flex items-center justify-between print:hidden">
        <nav className="flex items-center gap-2 text-sm text-yarn-warm-gray">
          <Link href="/patterns" className="hover:text-yarn-charcoal transition-colors">
            {t("print.breadcrumb")}
          </Link>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 2l4 4-4 4" />
          </svg>
          <Link href={`/patterns/${pattern.id}`} className="hover:text-yarn-charcoal transition-colors">
            {pattern.title}
          </Link>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 2l4 4-4 4" />
          </svg>
          <span className="text-yarn-charcoal font-medium">{t("print.print")}</span>
        </nav>
        <div className="flex gap-2">
          <PdfDownloadButton patternId={pattern.id} title={pattern.title} />
          <PrintButton />
        </div>
      </div>

      {/* Print content */}
      <div className="rounded-2xl bg-white/70 border border-yarn-sand/50 p-6 shadow-warm-sm print:rounded-none print:shadow-none print:border-none print:p-0">
        <h2 className="font-display text-xl font-bold text-yarn-charcoal">{pattern.title}</h2>
        <p className="mt-1 text-sm text-yarn-warm-gray">
          {pattern.width} × {pattern.height} —{" "}
          {new Date(pattern.updatedAt).toLocaleDateString("uk-UA")}
        </p>
        <div
          className="mt-6 grid gap-px bg-yarn-sand/60 print:bg-gray-300"
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
                    aspectRatio: w === 1 && h === 1 ? "1" : undefined
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
            <div
              key={`print-row-${rowIndex}`}
              className="flex min-h-4 items-center justify-center bg-yarn-oatmeal print:bg-gray-100 text-[10px] font-mono font-semibold text-yarn-warm-gray print:text-gray-600"
              style={{ gridColumn: document.width + 1, gridRow: displayIdx + 1 }}
            >
              {document.height - rowIndex}
            </div>
          ])}
          {Array.from({ length: document.width }, (_, columnIndex) => (
            <div
              key={`print-column-${columnIndex}`}
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

        {usedSymbols.length > 0 && (
          <div className="mt-8 border-t border-yarn-sand/40 pt-6 print:border-gray-300" style={{ breakInside: "avoid", pageBreakInside: "avoid" }}>
            <h3 className="text-sm font-semibold text-yarn-charcoal">{t("print.legend")}</h3>
            <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-sm md:grid-cols-3 lg:grid-cols-4">
              {usedSymbols.map((symbol) => (
                <div key={symbol.id} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-yarn-sand bg-white overflow-hidden">
                    {symbol.imageData ? (
                      <Image src={symbol.imageData} alt={symbol.label} width={18} height={18} className="object-contain max-w-[18px] max-h-[18px]" />
                    ) : (
                      <span className="text-sm font-semibold text-yarn-charcoal">{symbol.glyph}</span>
                    )}
                  </span>
                  <span className="text-yarn-charcoal">
                    <span className="font-medium">{symbol.label}</span>
                    {symbol.description && symbol.description !== symbol.label ? (
                      <span className="text-yarn-warm-gray"> — {symbol.description}</span>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
