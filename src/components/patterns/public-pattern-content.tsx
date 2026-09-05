"use client";

import Link from "next/link";
import { PatternGrid } from "@/components/patterns/pattern-grid";
import { PatternLegend } from "@/components/patterns/pattern-legend";
import { LikeButton } from "@/components/patterns/like-button";
import { useTranslation } from "@/lib/i18n/context";
import { PatternDocument, PatternSymbol } from "@/lib/patterns/model";

type Author = { name: string | null; username: string } | null;

type Props = {
  pattern: {
    id: string;
    title: string;
    description: string | null;
    width: number;
    height: number;
  };
  document: PatternDocument;
  usedSymbols: PatternSymbol[];
  author: Author;
  likeCount: number;
  likedByMe: boolean;
  isAuthenticated: boolean;
};

export function PublicPatternContent({
  pattern,
  document,
  usedSymbols,
  author,
  likeCount,
  likedByMe,
  isAuthenticated
}: Props) {
  const { t } = useTranslation();

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-white/70 border border-yarn-sand/50 p-6 sm:p-8 shadow-warm-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-display text-3xl font-bold text-yarn-charcoal break-words [overflow-wrap:anywhere]">
            {pattern.title}
          </h1>
          <LikeButton
            patternId={pattern.id}
            initialCount={likeCount}
            initialLiked={likedByMe}
            isAuthenticated={isAuthenticated}
          />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-yarn-warm-gray">
          <span>
            {pattern.width} × {pattern.height}
          </span>
          {author?.username ? (
            <>
              <span aria-hidden>·</span>
              <span>
                {t("publicPattern.byAuthor")}{" "}
                <Link
                  href={`/u/${author.username}`}
                  className="font-medium text-yarn-terracotta hover:text-yarn-terracotta-hover transition-colors"
                >
                  {author.name?.trim() || author.username}
                </Link>
              </span>
            </>
          ) : null}
        </div>
        {pattern.description ? (
          <p className="mt-4 max-w-3xl text-sm text-yarn-warm-gray leading-relaxed border-t border-yarn-sand/40 pt-4">
            {pattern.description}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl bg-white/70 border border-yarn-sand/50 p-6 shadow-warm-sm overflow-x-auto">
        <PatternGrid document={document} />
        <PatternLegend usedSymbols={usedSymbols} />
      </div>
    </section>
  );
}
