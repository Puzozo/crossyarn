"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  const router = useRouter();
  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDuplicate() {
    setDuplicating(true);
    try {
      const response = await fetch(`/api/patterns/${pattern.id}/duplicate`, { method: "POST" });
      if (response.ok) {
        router.refresh();
      }
    } finally {
      setDuplicating(false);
    }
  }

  async function handleDelete() {
    if (!confirm(t("patterns.deleteConfirm"))) return;
    setDeleting(true);
    try {
      await fetch(`/api/patterns/${pattern.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <article className="group rounded-2xl bg-white/70 border border-yarn-sand/50 p-6 shadow-warm-sm hover:shadow-warm transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-yarn-charcoal group-hover:text-yarn-terracotta transition-colors break-words [overflow-wrap:anywhere] line-clamp-2">
            {pattern.title}
          </h2>
          <p className="mt-1 text-sm text-yarn-warm-gray">
            {pattern.width} × {pattern.height} {t("patterns.cells")}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-yarn-sage-light px-3 py-1 text-xs font-medium text-yarn-sage">
          {pattern.visibility}
        </span>
      </div>
      {pattern.description ? (
        <p className="mt-3 line-clamp-2 text-sm text-yarn-warm-gray leading-relaxed">{pattern.description}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 border-t border-yarn-sand/40">
        <Link
          href={`/editor/${pattern.id}`}
          className="inline-flex items-center min-h-11 text-sm font-semibold text-yarn-terracotta hover:text-yarn-terracotta-hover transition-colors"
        >
          {t("patterns.openEditor")}
        </Link>
        <Link
          href={`/patterns/${pattern.id}`}
          className="inline-flex items-center min-h-11 text-sm font-medium text-yarn-warm-gray hover:text-yarn-charcoal transition-colors"
        >
          {t("patterns.details")}
        </Link>
        <button
          type="button"
          onClick={() => void handleDuplicate()}
          disabled={duplicating || deleting}
          className="inline-flex items-center min-h-11 text-sm font-medium text-yarn-warm-gray hover:text-yarn-charcoal transition-colors disabled:opacity-50"
        >
          {duplicating ? t("patterns.duplicating") : t("patterns.duplicate")}
        </button>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={deleting || duplicating}
          className="ml-auto inline-flex items-center min-h-11 text-sm font-medium text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
        >
          {deleting ? "..." : t("patterns.delete")}
        </button>
      </div>
    </article>
  );
}
