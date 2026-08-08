"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/context";
import { TranslationKey } from "@/lib/i18n/translations";
import type { PatternVisibilityValue } from "@/lib/patterns/validation";

const OPTIONS: PatternVisibilityValue[] = ["PRIVATE", "UNLISTED", "PUBLIC"];

const LABEL_KEYS: Record<PatternVisibilityValue, TranslationKey> = {
  PRIVATE: "visibility.private",
  UNLISTED: "visibility.unlisted",
  PUBLIC: "visibility.public"
};

const HINT_KEYS: Record<PatternVisibilityValue, TranslationKey> = {
  PRIVATE: "visibility.privateHint",
  UNLISTED: "visibility.unlistedHint",
  PUBLIC: "visibility.publicHint"
};

export function VisibilityControl({
  patternId,
  initialVisibility
}: {
  patternId: string;
  initialVisibility: PatternVisibilityValue;
}) {
  const { t } = useTranslation();
  const [visibility, setVisibility] = useState<PatternVisibilityValue>(initialVisibility);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  async function change(next: PatternVisibilityValue) {
    const previous = visibility;
    setVisibility(next);
    setSaving(true);
    setError(false);
    try {
      const response = await fetch(`/api/patterns/${patternId}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: next })
      });
      if (!response.ok) {
        setVisibility(previous);
        setError(true);
      }
    } catch {
      setVisibility(previous);
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  async function copyLink() {
    try {
      const url = `${window.location.origin}/p/${patternId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  const isShared = visibility !== "PRIVATE";

  return (
    <div className="rounded-2xl bg-white/70 border border-yarn-sand/50 p-5 shadow-warm-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <label htmlFor="visibility-select" className="text-sm font-semibold text-yarn-charcoal">
          {t("visibility.label")}
        </label>
        <div className="inline-flex rounded-full bg-yarn-oatmeal/60 p-1">
          {OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              id={option === visibility ? "visibility-select" : undefined}
              onClick={() => void change(option)}
              disabled={saving}
              aria-pressed={option === visibility}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-full transition-colors disabled:opacity-60 ${
                option === visibility
                  ? "bg-white text-yarn-charcoal shadow-warm-sm"
                  : "text-yarn-warm-gray hover:text-yarn-charcoal"
              }`}
            >
              {t(LABEL_KEYS[option])}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-yarn-warm-gray">{t(HINT_KEYS[visibility])}</p>

      {error ? <p className="mt-2 text-xs text-red-600">{t("visibility.updateError")}</p> : null}

      {isShared ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-yarn-sand/40 pt-4">
          <a
            href={`/p/${patternId}`}
            target="_blank"
            rel="noopener"
            className="text-sm font-semibold text-yarn-terracotta hover:text-yarn-terracotta-hover transition-colors"
          >
            {t("visibility.openPublic")} →
          </a>
          <button
            type="button"
            onClick={() => void copyLink()}
            className="text-sm font-medium text-yarn-warm-gray hover:text-yarn-charcoal transition-colors"
          >
            {copied ? t("visibility.linkCopied") : t("visibility.copyLink")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
