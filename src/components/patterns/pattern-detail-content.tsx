"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";

type Props = {
  pattern: {
    id: string;
    title: string;
    description: string | null;
    width: number;
    height: number;
  };
};

export function PatternDetailContent({ pattern }: Props) {
  const { t } = useTranslation();

  return (
    <section className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-yarn-warm-gray">
        <Link href="/patterns" className="hover:text-yarn-charcoal transition-colors">
          {t("patternDetail.breadcrumb")}
        </Link>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M4 2l4 4-4 4" />
        </svg>
        <span className="text-yarn-charcoal font-medium">{pattern.title}</span>
      </nav>

      <div className="rounded-3xl bg-white/70 border border-yarn-sand/50 p-6 sm:p-8 shadow-warm-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
          <div>
            <h1 className="font-display text-3xl font-bold text-yarn-charcoal">{pattern.title}</h1>
            <p className="mt-2 text-sm text-yarn-warm-gray">
              {pattern.width} × {pattern.height} {t("patternDetail.cells")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/editor/${pattern.id}`}>
              <Button>{t("patternDetail.openEditor")}</Button>
            </Link>
            <Link href={`/patterns/${pattern.id}/print`}>
              <Button variant="secondary">{t("patternDetail.print")}</Button>
            </Link>
            <a href={`/api/exports/${pattern.id}`} target="_blank">
              <Button variant="secondary">{t("patternDetail.svg")}</Button>
            </a>
          </div>
        </div>
        {pattern.description ? (
          <p className="mt-5 max-w-3xl text-sm text-yarn-warm-gray leading-relaxed border-t border-yarn-sand/40 pt-5">
            {pattern.description}
          </p>
        ) : null}
      </div>
    </section>
  );
}
