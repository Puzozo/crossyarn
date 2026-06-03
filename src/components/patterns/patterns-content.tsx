"use client";

import { useTranslation } from "@/lib/i18n/context";
import { CreatePatternButton } from "@/components/patterns/create-pattern-button";
import { PatternCard } from "@/components/patterns/pattern-card";
import { ImportPatternCard } from "@/components/import/import-pattern-card";

type PatternData = {
  id: string;
  title: string;
  description: string | null;
  width: number;
  height: number;
  visibility: string;
  updatedAt: string;
};

export function PatternsContent({ patterns }: { patterns: PatternData[] }) {
  const { t } = useTranslation();

  return (
    <section className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-yarn-charcoal">
            {t("patterns.title")}
          </h1>
          <p className="mt-2 text-sm text-yarn-warm-gray">
            {t("patterns.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ImportPatternCard />
          <CreatePatternButton />
        </div>
      </div>
      {patterns.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-yarn-sand bg-white/50 p-12 text-center">
          <div className="flex justify-center mb-4">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-yarn-sand">
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
              <path d="M24 16v16M16 24h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-yarn-warm-gray text-base">
            {t("patterns.empty")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {patterns.map((pattern) => (
            <PatternCard key={pattern.id} pattern={pattern} />
          ))}
        </div>
      )}
    </section>
  );
}
