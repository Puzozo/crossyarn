"use client";

import Link from "next/link";
import { useState } from "react";
import { PatternEditor } from "@/components/editor/pattern-editor";
import { PatternDocument } from "@/lib/patterns/model";
import { useTranslation } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  patternId: string;
  title: string;
  description: string | null;
  initialPattern: PatternDocument;
};

export function EditorPageContent({ patternId, title: initialTitle, description: initialDescription, initialPattern }: Props) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(initialTitle);
  const [draftDescription, setDraftDescription] = useState(initialDescription ?? "");
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);

  async function handleSaveTitle() {
    if (draftTitle.trim().length < 2) {
      setTitleError("Мінімум 2 символи");
      return;
    }
    setSaving(true);
    setTitleError(null);
    try {
      const response = await fetch(`/api/patterns/${patternId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: draftTitle.trim(), description: draftDescription.trim() })
      });
      if (response.ok) {
        setTitle(draftTitle.trim());
        setDescription(draftDescription.trim());
        setEditing(false);
      } else {
        setTitleError(t("editor.titleError"));
      }
    } catch {
      setTitleError(t("editor.titleError"));
    } finally {
      setSaving(false);
    }
  }

  function handleStartEdit() {
    setDraftTitle(title);
    setDraftDescription(description);
    setEditing(true);
    setTitleError(null);
  }

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

      {editing ? (
        <div className="rounded-2xl bg-white/70 border border-yarn-sand/50 p-4 space-y-3 shadow-warm-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-yarn-warm-gray">
                {t("editor.titleLabel")}
              </label>
              <Input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                maxLength={120}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && void handleSaveTitle()}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-yarn-warm-gray">
                {t("editor.descriptionLabel")}
              </label>
              <Input
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                maxLength={500}
              />
            </div>
          </div>
          {titleError && <p className="text-xs text-red-600">{titleError}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={() => void handleSaveTitle()} disabled={saving}>
              {saving ? "..." : t("editor.saveTitle")}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
              {t("editor.cancelEdit")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-yarn-charcoal">{title}</h1>
            <p className="mt-1 text-sm text-yarn-warm-gray">
              {description || t("editor.editHint")}
            </p>
          </div>
          <button
            type="button"
            onClick={handleStartEdit}
            className="mt-1.5 rounded-lg p-1.5 text-yarn-warm-gray hover:text-yarn-charcoal hover:bg-yarn-oatmeal transition-colors"
            title={t("editor.editTitle")}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.5 1.5l3 3L5 13H2v-3L10.5 1.5z" />
            </svg>
          </button>
        </div>
      )}

      <PatternEditor
        patternId={patternId}
        title={title}
        description={description}
        initialPattern={initialPattern}
      />
    </section>
  );
}
