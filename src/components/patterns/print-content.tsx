"use client";

import Image from "next/image";
import Link from "next/link";
import { PrintButton } from "@/components/patterns/print-button";
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
        <PrintButton />
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
            gridTemplateColumns: `repeat(${document.width}, minmax(16px, 1fr)) 32px`
          }}
        >
          {document.cells.flatMap((row, rowIndex) => [
            ...row.map((cell, columnIndex) => {
              const symbol = document.symbols.find((item) => item.id === cell.symbolId);
              return (
                <div
                  key={`${rowIndex}-${columnIndex}`}
                  className="flex aspect-square items-center justify-center bg-white text-[10px] font-semibold text-yarn-charcoal print:text-black"
                  style={{ backgroundColor: cell.color }}
                >
                  {symbol?.imageData ? (
                    <Image src={symbol.imageData} alt={symbol.label} width={16} height={16} className="object-contain" />
                  ) : (
                    symbol?.glyph ?? "·"
                  )}
                </div>
              );
            }),
            <div
              key={`print-row-${rowIndex}`}
              className="flex min-h-6 items-center justify-center bg-yarn-oatmeal print:bg-gray-100 text-[10px] font-mono font-semibold text-yarn-warm-gray print:text-gray-600"
            >
              {document.height - rowIndex}
            </div>
          ])}
          {Array.from({ length: document.width }, (_, columnIndex) => (
            <div
              key={`print-column-${columnIndex}`}
              className="flex min-h-6 items-center justify-center bg-yarn-oatmeal print:bg-gray-100 text-[10px] font-mono font-semibold text-yarn-warm-gray print:text-gray-600"
            >
              {document.width - columnIndex}
            </div>
          ))}
          <div className="bg-yarn-oatmeal print:bg-gray-100" />
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
