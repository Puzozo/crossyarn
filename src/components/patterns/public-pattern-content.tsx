"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PatternGrid } from "@/components/patterns/pattern-grid";
import { PatternLegend } from "@/components/patterns/pattern-legend";
import { LikeButton } from "@/components/patterns/like-button";
import { useTranslation } from "@/lib/i18n/context";
import { PatternDocument, PatternSymbol } from "@/lib/patterns/model";
import { Button } from "@/components/ui/button";
import { KnittingModeBar } from "@/components/patterns/knitting-mode-bar";
import { useKnittingProgress } from "@/lib/patterns/knitting-progress";

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
  const knitting = useKnittingProgress(
    pattern.id,
    document.height,
    document.view.skipPurlRows ?? false
  );
  const gridContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!knitting.active) return;
    gridContainerRef.current
      ?.querySelector("[data-knit-current-row]")
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [knitting.active, knitting.row]);

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
        {/* Share button */}
        <ShareButton patternId={pattern.id} />
        {pattern.description ? (
          <p className="mt-4 max-w-3xl text-sm text-yarn-warm-gray leading-relaxed border-t border-yarn-sand/40 pt-4">
            {pattern.description}
          </p>
        ) : null}
      </div>

      <div
        ref={gridContainerRef}
        className="rounded-2xl bg-white/70 border border-yarn-sand/50 p-6 shadow-warm-sm overflow-x-auto"
      >
        <KnittingModeBar knitting={knitting} />
        <PatternGrid
          document={document}
          highlightRow={knitting.active ? knitting.row : undefined}
          onRowClick={knitting.active ? knitting.goTo : undefined}
        />
        <PatternLegend usedSymbols={usedSymbols} />
      </div>
    </section>
  );
}

function ShareButton({ patternId }: { patternId: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `https://crossyarn.online/p/${patternId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: open URL in new tab
      window.open(url, "_blank");
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-yarn-warm-gray hover:text-yarn-charcoal hover:bg-yarn-oatmeal/50 transition-colors"
        title={t("publicPattern.share")}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {copied ? (
            <>
              <path d="M3 8.5l3 3 7-7" />
            </>
          ) : (
            <>
              <circle cx="11" cy="4" r="2" />
              <circle cx="5" cy="8" r="2" />
              <circle cx="11" cy="12" r="2" />
              <path d="M7 9.5l3 1.5M9 6.5l3-1.5" />
            </>
          )}
        </svg>
        <span>{copied ? t("publicPattern.linkCopied") : t("publicPattern.share")}</span>
      </button>
    </div>
  );
}
