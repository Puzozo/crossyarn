"use client";

import { useState } from "react";
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
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? patterns.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          (p.description ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : patterns;

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

      {patterns.length > 0 && (
        <div className="relative">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-yarn-warm-gray pointer-events-none"
          >
            <circle cx="6.5" cy="6.5" r="4.5" />
            <path d="M10 10l3.5 3.5" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("patterns.search")}
            className="w-full sm:max-w-sm pl-9 pr-4 py-2.5 rounded-full border border-yarn-sand/60 bg-white/80 text-sm text-yarn-charcoal placeholder:text-yarn-warm-gray/70 focus:outline-none focus:ring-2 focus:ring-yarn-terracotta/30 focus:border-yarn-terracotta/50 transition"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-yarn-sand bg-white/50 p-12 text-center">
          <div className="flex justify-center mb-4">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-yarn-sand">
              <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
              <path d="M24 16v16M16 24h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-yarn-warm-gray text-base">
            {search.trim() ? t("patterns.noResults", { query: search }) : t("patterns.empty")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((pattern) => (
            <PatternCard key={pattern.id} pattern={pattern} />
          ))}
        </div>
      )}
    </section>
  );
}
