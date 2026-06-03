"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

type PatternData = {
  id: string;
  title: string;
  description: string | null;
  width: number;
  height: number;
  visibility: string;
};

export function PatternCard({ pattern }: { pattern: PatternData }) {
  const { t } = useTranslation();

  return (
    <article className="group rounded-2xl bg-white/70 border border-yarn-sand/50 p-6 shadow-warm-sm hover:shadow-warm transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-yarn-charcoal group-hover:text-yarn-terracotta transition-colors">
            {pattern.title}
          </h2>
          <p className="mt-1 text-sm text-yarn-warm-gray">
            {pattern.width} × {pattern.height} {t("patterns.cells")}
          </p>
        </div>
        <span className="rounded-full bg-yarn-sage-light px-3 py-1 text-xs font-medium text-yarn-sage">
          {pattern.visibility}
        </span>
      </div>
      {pattern.description ? (
        <p className="mt-3 line-clamp-2 text-sm text-yarn-warm-gray leading-relaxed">{pattern.description}</p>
      ) : null}
      <div className="mt-5 flex gap-4 pt-4 border-t border-yarn-sand/40">
        <Link
          href={`/editor/${pattern.id}`}
          className="text-sm font-semibold text-yarn-terracotta hover:text-yarn-terracotta-hover transition-colors"
        >
          {t("patterns.openEditor")}
        </Link>
        <Link
          href={`/patterns/${pattern.id}`}
          className="text-sm font-medium text-yarn-warm-gray hover:text-yarn-charcoal transition-colors"
        >
          {t("patterns.details")}
        </Link>
      </div>
    </article>
  );
}
