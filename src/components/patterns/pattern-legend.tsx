"use client";

import Image from "next/image";
import { useTranslation } from "@/lib/i18n/context";
import { PatternSymbol } from "@/lib/patterns/model";

/** Legend of the symbols actually used in a pattern. Shared by print + public views. */
export function PatternLegend({ usedSymbols }: { usedSymbols: PatternSymbol[] }) {
  const { t } = useTranslation();
  if (usedSymbols.length === 0) return null;

  return (
    <div
      className="mt-8 border-t border-yarn-sand/40 pt-6 print:border-gray-300"
      style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
    >
      <h3 className="text-sm font-semibold text-yarn-charcoal">{t("print.legend")}</h3>
      <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-sm md:grid-cols-3 lg:grid-cols-4">
        {usedSymbols.map((symbol) => (
          <div key={symbol.id} className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-yarn-sand bg-white overflow-hidden">
              {symbol.imageData ? (
                <Image
                  src={symbol.imageData}
                  alt={symbol.label}
                  width={18}
                  height={18}
                  className="object-contain max-w-[18px] max-h-[18px]"
                />
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
  );
}
