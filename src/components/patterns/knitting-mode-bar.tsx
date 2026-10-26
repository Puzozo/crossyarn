"use client";

import { useEffect, useState } from "react";
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
      // Only left/right: up/down keep scrolling the page.
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [active, next, prev]);

  if (!knitting.active) {
    return (
      <div>
        <Button variant="secondary" size="sm" onClick={() => knitting.setActive(true)}>
          {t("knitting.start")}
        </Button>
      </div>
    );
  }

  const percent =
    knitting.total > 0 ? Math.round(((knitting.position - 1) / knitting.total) * 100) : 0;
  const isLastRow = knitting.position >= knitting.total;

  return (
    // Sticks to the top of the viewport (the site header scrolls away) so the arrows
    // stay reachable on a tall chart. Rendered outside the grid's horizontal scroller.
    <div className="sticky top-2 z-20 rounded-2xl border border-yarn-terracotta/40 bg-[#FBF1EE] p-3 shadow-warm-sm sm:p-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          className="min-w-11"
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
          className="min-w-11"
          aria-label={t("knitting.next")}
          onClick={knitting.next}
          disabled={knitting.position >= knitting.total}
        >
          →
        </Button>
        <span className="text-xs text-yarn-warm-gray">
          {isLastRow ? t("knitting.lastRow") : t("knitting.progress", { percent })}
        </span>
        <div className="ml-auto flex gap-2">
          <ResetButton onReset={knitting.reset} />
          <Button variant="ghost" size="sm" onClick={() => knitting.setActive(false)}>
            {t("knitting.stop")}
          </Button>
        </div>
      </div>
      <p className="text-xs text-yarn-warm-gray pointer-coarse:hidden">{t("knitting.hint")}</p>
      <p className="hidden text-xs text-yarn-warm-gray pointer-coarse:block">{t("knitting.hintTouch")}</p>
    </div>
  );
}

// Two-step reset: the first tap asks, the second (within 4s) resets.
function ResetButton({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(timer);
  }, [confirming]);

  return (
    <Button
      variant="ghost"
      size="sm"
      className={confirming ? "text-yarn-terracotta" : undefined}
      onClick={() => {
        if (confirming) {
          setConfirming(false);
          onReset();
        } else {
          setConfirming(true);
        }
      }}
    >
      {confirming ? t("knitting.resetConfirm") : t("knitting.reset")}
    </Button>
  );
}
