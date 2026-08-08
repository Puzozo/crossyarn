"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

type ExplorePattern = {
  id: string;
  title: string;
  width: number;
  height: number;
  updatedAtMs: number;
  author: { name: string | null; username: string } | null;
};

type Props = {
  patterns: ExplorePattern[];
  query: string;
  page: number;
  totalPages: number;
  totalCount: number;
};

function pageHref(query: string, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/explore?${qs}` : "/explore";
}

export function ExploreContent({ patterns, query, page, totalPages, totalCount }: Props) {
  const { t } = useTranslation();

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-yarn-charcoal">
          {t("explore.title")}
        </h1>
        <p className="max-w-2xl text-sm sm:text-base text-yarn-warm-gray">
          {t("explore.subtitle")}
        </p>
      </header>

      {/* Search — plain GET form so results are URL-addressable */}
      <form action="/explore" method="get" className="flex max-w-xl gap-2" role="search">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={t("explore.searchPlaceholder")}
          className="w-full rounded-xl border border-yarn-sand bg-white/70 px-4 py-2.5 text-sm text-yarn-charcoal placeholder:text-yarn-warm-gray/70 focus:border-yarn-terracotta focus:outline-none focus:ring-2 focus:ring-yarn-terracotta/20"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-yarn-terracotta px-5 py-2.5 text-sm font-semibold text-white shadow-warm-sm transition-colors hover:bg-yarn-terracotta-hover"
        >
          {t("explore.searchButton")}
        </button>
      </form>

      {query ? (
        <p className="text-sm text-yarn-warm-gray">
          {t("explore.resultsFor", { count: totalCount, query })}{" "}
          <Link href="/explore" className="font-medium text-yarn-terracotta hover:text-yarn-terracotta-hover transition-colors">
            {t("explore.clearSearch")}
          </Link>
        </p>
      ) : null}

      {patterns.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-yarn-sand bg-white/50 p-12 text-center">
          <p className="text-sm text-yarn-warm-gray">
            {query ? t("explore.noResults") : t("explore.empty")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {patterns.map((pattern) => (
            <div
              key={pattern.id}
              className="group rounded-2xl bg-white/70 border border-yarn-sand/50 shadow-warm-sm hover:shadow-warm transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
            >
              <Link href={`/p/${pattern.id}`} className="block">
                <div className="relative aspect-square border-b border-yarn-sand/40 bg-white">
                  <Image
                    src={`/api/patterns/${pattern.id}/thumbnail?v=${pattern.updatedAtMs}`}
                    alt={pattern.title}
                    fill
                    unoptimized
                    loading="lazy"
                    className="object-contain p-3"
                  />
                </div>
                <div className="p-4 pb-2">
                  <h2 className="font-display text-base font-semibold text-yarn-charcoal group-hover:text-yarn-terracotta transition-colors break-words [overflow-wrap:anywhere] line-clamp-2">
                    {pattern.title}
                  </h2>
                  <p className="mt-0.5 text-xs text-yarn-warm-gray">
                    {pattern.width} × {pattern.height}
                  </p>
                </div>
              </Link>
              <div className="px-4 pb-3 min-h-6">
                {pattern.author ? (
                  <Link
                    href={`/u/${pattern.author.username}`}
                    className="text-xs font-medium text-yarn-warm-gray hover:text-yarn-terracotta transition-colors"
                  >
                    {pattern.author.name?.trim() || pattern.author.username}{" "}
                    <span className="text-yarn-warm-gray/70">@{pattern.author.username}</span>
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <nav className="flex items-center justify-center gap-4 pt-2" aria-label="Pagination">
          {page > 1 ? (
            <Link
              href={pageHref(query, page - 1)}
              className="rounded-xl border border-yarn-sand bg-white/70 px-4 py-2 text-sm font-medium text-yarn-charcoal hover:border-yarn-terracotta/40 hover:bg-yarn-terracotta-light/30 transition-colors"
            >
              ← {t("explore.prevPage")}
            </Link>
          ) : (
            <span className="rounded-xl border border-yarn-sand/50 px-4 py-2 text-sm text-yarn-warm-gray/50">
              ← {t("explore.prevPage")}
            </span>
          )}
          <span className="text-sm text-yarn-warm-gray">
            {t("explore.pageOf", { page, total: totalPages })}
          </span>
          {page < totalPages ? (
            <Link
              href={pageHref(query, page + 1)}
              className="rounded-xl border border-yarn-sand bg-white/70 px-4 py-2 text-sm font-medium text-yarn-charcoal hover:border-yarn-terracotta/40 hover:bg-yarn-terracotta-light/30 transition-colors"
            >
              {t("explore.nextPage")} →
            </Link>
          ) : (
            <span className="rounded-xl border border-yarn-sand/50 px-4 py-2 text-sm text-yarn-warm-gray/50">
              {t("explore.nextPage")} →
            </span>
          )}
        </nav>
      ) : null}
    </section>
  );
}
