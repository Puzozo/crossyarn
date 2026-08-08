"use client";

import Link from "next/link";
import { PrintButton } from "@/components/patterns/print-button";
import { PdfDownloadButton } from "@/components/patterns/pdf-download-button";
import { PatternGrid } from "@/components/patterns/pattern-grid";
import { PatternLegend } from "@/components/patterns/pattern-legend";
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
        <div className="mt-6">
          <PatternGrid document={document} />
        </div>

        <PatternLegend usedSymbols={usedSymbols} />
      </div>
    </section>
  );
}
