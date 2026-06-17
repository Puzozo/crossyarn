"use client";

import { useTranslation } from "@/lib/i18n/context";
import type { Language } from "@/lib/i18n/translations";
import type { LegalDoc } from "@/lib/legal/content";

export function LegalPage({ doc }: { doc: Record<Language, LegalDoc> }) {
  const { lang } = useTranslation();
  const d = doc[lang] ?? doc.uk;

  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-yarn-charcoal">{d.title}</h1>
      <p className="mt-2 text-sm text-yarn-warm-gray">{d.updated}</p>
      <p className="mt-6 text-sm leading-relaxed text-yarn-charcoal/90">{d.intro}</p>

      <div className="mt-8 space-y-8">
        {d.sections.map((section) => (
          <section key={section.heading} className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-yarn-charcoal">{section.heading}</h2>
            {section.body.map((paragraph, i) => (
              <p key={i} className="text-sm leading-relaxed text-yarn-warm-gray">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
