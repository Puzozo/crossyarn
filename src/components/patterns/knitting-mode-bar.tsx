"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";
import { useKnittingProgress } from "@/lib/patterns/knitting-progress";

type KnittingState = ReturnType<typeof useKnittingProgress>;

export function KnittingModeBar({ knitting }: { knitting: KnittingState }) {
  const { t } = useTranslation();
  const { active, next, prev } = knitting;

  useEffect(() => {
    if (!active) return;
    function handleKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target !== null && target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        prev();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [active, next, prev]);

  if (!knitting.active) {
    return (
      <div className="mb-4">
        <Button variant="secondary" size="sm" onClick={() => knitting.setActive(true)}>
          {t("knitting.start")}
        </Button>
      </div>
    );
  }

  const percent =
    knitting.total > 0 ? Math.round(((knitting.position - 1) / knitting.total) * 100) : 0;

  return (
    <div className="mb-4 rounded-2xl border border-yarn-terracotta/40 bg-yarn-terracotta-light/40 p-3 sm:p-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          aria-label={t("knitting.prev")}
          onClick={knitting.prev}
          disabled={knitting.position <= 1}
        >
          ←
        </Button>
        <span
          className="min-w-28 text-center font-semibold text-yarn-charcoal"
          aria-live="polite"
        >
          {t("knitting.rowOf", {
            row: knitting.row,
            total: knitting.rowNumbers[knitting.rowNumbers.length - 1] ?? knitting.row
          })}
        </span>
        <Button
          variant="primary"
          size="sm"
          aria-label={t("knitting.next")}
          onClick={knitting.next}
          disabled={knitting.position >= knitting.total}
        >
          →
        </Button>
        <span className="text-xs text-yarn-warm-gray">
          {t("knitting.progress", { percent })}
        </span>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="sm" onClick={knitting.reset}>
            {t("knitting.reset")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => knitting.setActive(false)}>
            {t("knitting.stop")}
          </Button>
        </div>
      </div>
      <p className="text-xs text-yarn-warm-gray">{t("knitting.hint")}</p>
    </div>
  );
}
