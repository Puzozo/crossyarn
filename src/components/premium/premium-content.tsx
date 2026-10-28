"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

export function PremiumContent() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto max-w-lg space-y-6 py-12 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-yarn-sage-light text-yarn-sage">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z" strokeLinecap="round" />
        </svg>
      </span>
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-bold text-yarn-charcoal">{t("premium.heading")}</h1>
        <p className="text-yarn-warm-gray">
          {t("premium.subtitle")}
        </p>
        <p className="text-sm text-yarn-warm-gray/70">
          {t("premium.note")}
        </p>
      </div>
      <ul className="mx-auto inline-block space-y-2 text-left text-sm text-yarn-charcoal">
        <li>✅ {t("premium.feature1")}</li>
        <li>✅ {t("premium.feature2")}</li>
        <li>✅ {t("premium.feature3")}</li>
      </ul>
      <div className="rounded-2xl bg-yarn-sage-light/40 border border-yarn-sage/30 px-4 py-3 text-xs text-yarn-sage">
        {t("premium.thanks")}
      </div>
      <div className="flex gap-3 justify-center">
        <Link
          href="/patterns"
          className="inline-block rounded-full bg-yarn-oatmeal border border-yarn-sand px-5 py-2.5 text-sm font-semibold text-yarn-charcoal hover:bg-yarn-sand transition-colors"
        >
          {t("premium.backToPatterns")}
        </Link>
        <Link
          href="/explore"
          className="inline-block rounded-full bg-yarn-terracotta px-5 py-2.5 text-sm font-semibold text-white hover:bg-yarn-terracotta-hover transition-colors"
        >
          {t("premium.explore")}
        </Link>
      </div>
    </section>
  );
}
