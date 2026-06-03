"use client";

import Link from "next/link";
import { PatternEditor } from "@/components/editor/pattern-editor";
import { PatternDocument } from "@/lib/patterns/model";
import { useTranslation } from "@/lib/i18n/context";

type Props = {
  patternId: string;
  title: string;
  description: string | null;
  initialPattern: PatternDocument;
};

export function EditorPageContent({ patternId, title, description, initialPattern }: Props) {
  const { t } = useTranslation();

  return (
    <section className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-yarn-warm-gray">
        <Link href="/patterns" className="hover:text-yarn-charcoal transition-colors">
          {t("patterns.title")}
        </Link>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M4 2l4 4-4 4" />
        </svg>
        <span className="text-yarn-charcoal font-medium">{title}</span>
      </nav>

      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-yarn-charcoal">{title}</h1>
        <p className="mt-1 text-sm text-yarn-warm-gray">
          {t("editor.editHint")}
        </p>
      </div>
      <PatternEditor
        patternId={patternId}
        title={title}
        description={description}
        initialPattern={initialPattern}
      />
    </section>
  );
}
