"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

type SavedPattern = {
  id: string;
  title: string;
  width: number;
  height: number;
  updatedAtMs: number;
  author: { name: string | null; username: string; avatarUrl: string | null } | null;
};

type Props = {
  patterns: SavedPattern[];
  page: number;
  totalPages: number;
};

export function SavedContent({ patterns, page, totalPages }: Props) {
  const { t } = useTranslation();
  // Unliking removes the card immediately; a reload rebuilds the list from the DB.
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const visible = patterns.filter((p) => !hiddenIds.has(p.id));

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-yarn-charcoal">
          {t("saved.title")}
        </h1>
        <p className="max-w-2xl text-sm sm:text-base text-yarn-warm-gray">{t("saved.subtitle")}</p>
      </header>

      {visible.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-yarn-sand bg-white/50 p-12 text-center">
          <p className="text-sm text-yarn-warm-gray">{t("saved.empty")}</p>
          <Link
            href="/explore"
            className="mt-4 inline-block rounded-xl bg-yarn-terracotta px-5 py-2.5 text-sm font-semibold text-white shadow-warm-sm transition-colors hover:bg-yarn-terracotta-hover"
          >
            {t("saved.goExplore")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((pattern) => (
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
              <div className="flex items-center justify-between gap-2 px-4 pb-3 min-h-6">
                {pattern.author ? (
                  <Link
                    href={`/u/${pattern.author.username}`}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-yarn-warm-gray hover:text-yarn-terracotta transition-colors"
                  >
                    {pattern.author.avatarUrl ? (
                      <Image
                        src={pattern.author.avatarUrl}
                        alt=""
                        width={20}
                        height={20}
                        unoptimized
                        className="h-5 w-5 rounded-full object-cover border border-yarn-sand/60"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-yarn-terracotta/15 text-[10px] font-bold text-yarn-terracotta"
                      >
                        {(pattern.author.name?.trim() || pattern.author.username).charAt(0).toUpperCase()}
                      </span>
                    )}
                    {pattern.author.name?.trim() || pattern.author.username}
                  </Link>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={async () => {
                    setHiddenIds((prev) => new Set(prev).add(pattern.id));
                    try {
                      const res = await fetch(`/api/patterns/${pattern.id}/like`, { method: "DELETE" });
                      if (!res.ok) throw new Error("unlike failed");
                    } catch {
                      setHiddenIds((prev) => {
                        const next = new Set(prev);
                        next.delete(pattern.id);
                        return next;
                      });
                    }
                  }}
                  aria-label={t("like.unlike")}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-yarn-terracotta hover:text-yarn-terracotta-hover transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <nav className="flex items-center justify-center gap-4 pt-2" aria-label="Pagination">
          {page > 1 ? (
            <Link
              href={page - 1 > 1 ? `/saved?page=${page - 1}` : "/saved"}
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
              href={`/saved?page=${page + 1}`}
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
