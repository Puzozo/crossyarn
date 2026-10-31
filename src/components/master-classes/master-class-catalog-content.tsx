"use client";

import Link from "next/link";
import { MasterClassCard } from "@/components/master-classes/master-class-card";
import { useTranslation } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n/translations";

type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

const LEVELS: Difficulty[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];
const LEVEL_LABEL_KEYS: Record<Difficulty, TranslationKey> = {
  BEGINNER: "masterClass.difficulty.BEGINNER",
  INTERMEDIATE: "masterClass.difficulty.INTERMEDIATE",
  ADVANCED: "masterClass.difficulty.ADVANCED"
};

type CatalogItem = {
  slug: string;
  title: string;
  coverAssetId: string | null;
  coverAlt: string;
  difficulty: Difficulty;
  durationMinutes: number | null;
  itemLang: "uk" | "en";
};

type Props = {
  items: CatalogItem[];
  level: Difficulty | null;
  langFilter: "uk" | "en" | null;
  page: number;
  totalPages: number;
};

function buildHref(level: Difficulty | null, langFilter: "uk" | "en" | null, page: number) {
  const params = new URLSearchParams();
  if (level) params.set("level", level);
  if (langFilter) params.set("lang", langFilter);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/master-classes?${qs}` : "/master-classes";
}

function pillClass(active: boolean) {
  return `shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
    active ? "bg-yarn-terracotta text-white" : "bg-yarn-oatmeal/60 text-yarn-charcoal hover:bg-yarn-oatmeal"
  }`;
}

export function MasterClassCatalogContent({ items, level, langFilter, page, totalPages }: Props) {
  const { t, lang } = useTranslation();
  const hasFilters = Boolean(level || langFilter);

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-yarn-charcoal">
          {t("masterClass.catalog.title")}
        </h1>
        <p className="max-w-2xl text-sm sm:text-base text-yarn-warm-gray">{t("masterClass.catalog.intro")}</p>
      </header>

      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="shrink-0 text-xs font-medium uppercase text-yarn-warm-gray">
            {t("masterClass.catalog.filterLevel")}
          </span>
          <Link href={buildHref(null, langFilter, 1)} className={pillClass(!level)}>
            {t("masterClass.catalog.levelAll")}
          </Link>
          {LEVELS.map((lvl) => (
            <Link key={lvl} href={buildHref(lvl, langFilter, 1)} className={pillClass(level === lvl)}>
              {t(LEVEL_LABEL_KEYS[lvl])}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="shrink-0 text-xs font-medium uppercase text-yarn-warm-gray">
            {t("masterClass.catalog.filterLang")}
          </span>
          <Link href={buildHref(level, null, 1)} className={pillClass(!langFilter)}>
            {t("masterClass.catalog.langAll")}
          </Link>
          <Link href={buildHref(level, "uk", 1)} className={pillClass(langFilter === "uk")}>
            {t("masterClass.catalog.langUk")}
          </Link>
          <Link href={buildHref(level, "en", 1)} className={pillClass(langFilter === "en")}>
            {t("masterClass.catalog.langEn")}
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-yarn-sand bg-white/50 p-12 text-center">
          <p className="text-sm text-yarn-warm-gray">
            {hasFilters ? t("masterClass.catalog.noResults") : t("masterClass.catalog.empty")}
          </p>
          {hasFilters ? (
            <Link
              href="/master-classes"
              className="mt-4 inline-block rounded-xl bg-yarn-terracotta px-5 py-2.5 text-sm font-semibold text-white shadow-warm-sm transition-colors hover:bg-yarn-terracotta-hover"
            >
              {t("masterClass.catalog.resetFilters")}
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((mc) => (
            <MasterClassCard
              key={mc.slug}
              slug={mc.slug}
              title={mc.title}
              coverAssetId={mc.coverAssetId}
              coverAlt={mc.coverAlt}
              difficulty={mc.difficulty}
              durationMinutes={mc.durationMinutes}
              itemLang={mc.itemLang}
              lang={lang}
            />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <nav className="flex items-center justify-center gap-4 pt-2" aria-label={t("common.pagination")}>
          {page > 1 ? (
            <Link
              href={buildHref(level, langFilter, page - 1)}
              className="rounded-xl border border-yarn-sand bg-white/70 px-4 py-2 text-sm font-medium text-yarn-charcoal hover:border-yarn-terracotta/40 hover:bg-yarn-terracotta-light/30 transition-colors"
            >
              ← {t("masterClass.catalog.prevPage")}
            </Link>
          ) : (
            <span className="rounded-xl border border-yarn-sand/50 px-4 py-2 text-sm text-yarn-warm-gray/50">
              ← {t("masterClass.catalog.prevPage")}
            </span>
          )}
          <span className="text-sm text-yarn-warm-gray">
            {t("masterClass.catalog.pageOf", { page, total: totalPages })}
          </span>
          {page < totalPages ? (
            <Link
              href={buildHref(level, langFilter, page + 1)}
              className="rounded-xl border border-yarn-sand bg-white/70 px-4 py-2 text-sm font-medium text-yarn-charcoal hover:border-yarn-terracotta/40 hover:bg-yarn-terracotta-light/30 transition-colors"
            >
              {t("masterClass.catalog.nextPage")} →
            </Link>
          ) : (
            <span className="rounded-xl border border-yarn-sand/50 px-4 py-2 text-sm text-yarn-warm-gray/50">
              {t("masterClass.catalog.nextPage")} →
            </span>
          )}
        </nav>
      ) : null}
    </section>
  );
}
