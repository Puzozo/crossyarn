"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CollapsiblePanel } from "@/components/ui/collapsible-panel";
import { ImageUploadDialog } from "@/components/admin/content/image-upload-dialog";
import { PatternPickerDialog } from "@/components/admin/content/pattern-picker-dialog";
import { BlockEditor } from "@/components/admin/content/block-editor";
import { slugify } from "@/lib/content/slug";

export type MasterClassEditorData = {
  id: string;
  slug: string;
  lang: "uk" | "en";
  translationOfId: string | null;
  title: string;
  summary: string;
  coverAssetId: string | null;
  coverAlt: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  durationMinutes: number | null;
  materials: { yarn: string[]; tools: string[]; other: string[] };
  tags: string[];
  mainPatternId: string | null;
  gallery: { assetId: string; alt: string; caption?: string }[];
  content: string;
  status: "DRAFT" | "PUBLISHED" | "PENDING_REVIEW" | "REJECTED";
  publishedAt: string | null;
  priceUah: number | null;
  previewBlockCount: number;
  updatedAt: string;
};

export type PostEditorData = {
  id: string;
  slug: string;
  lang: "uk" | "en";
  translationOf: string | null;
  title: string;
  heading: string;
  description: string;
  tags: string[];
  coverAssetId: string | null;
  coverAlt: string;
  content: string;
  status: "DRAFT" | "PUBLISHED" | "PENDING_REVIEW" | "REJECTED";
  publishedAt: string | null;
  updatedAt: string;
};

type Props =
  | {
      kind: "masterClass";
      data: MasterClassEditorData;
      mainPattern: { id: string; title: string } | null;
      translationPartner: { id: string; title: string; lang: string } | null;
    }
  | { kind: "post"; data: PostEditorData };

type Form = MasterClassEditorData | PostEditorData;
const INPUT_CLASS =
  "w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-indigo-500";
const LABEL_CLASS = "block text-xs text-gray-400 mb-1";
const BUTTON_SECONDARY_CLASS =
  "px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors disabled:opacity-50";
const DIFFICULTY_OPTIONS: { value: MasterClassEditorData["difficulty"]; label: string }[] = [
  { value: "BEGINNER", label: "Початковий" },
  { value: "INTERMEDIATE", label: "Середній" },
  { value: "ADVANCED", label: "Просунутий" },
];

function MaterialList({ label, items, onChange }: { label: string; items: string[]; onChange: (next: string[]) => void }) {
  const [input, setInput] = useState("");
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-gray-400">{label}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span className="flex-1 text-sm text-gray-200 truncate">{item}</span>
            <button
              type="button"
              disabled={i === 0}
              onClick={() => {
                const next = [...items];
                [next[i - 1], next[i]] = [next[i], next[i - 1]];
                onChange(next);
              }}
              className="text-gray-500 hover:text-white disabled:opacity-30"
              aria-label="Вище"
            >
              ↑
            </button>
            <button
              type="button"
              disabled={i === items.length - 1}
              onClick={() => {
                const next = [...items];
                [next[i + 1], next[i]] = [next[i], next[i + 1]];
                onChange(next);
              }}
              className="text-gray-500 hover:text-white disabled:opacity-30"
              aria-label="Нижче"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="text-red-400 hover:text-red-300"
              aria-label="Видалити"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-1.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const v = input.trim();
              if (v && items.length < 50) onChange([...items, v]);
              setInput("");
            }
          }}
          placeholder="Додати..."
          className="flex-1 rounded-lg bg-gray-800 border border-gray-700 text-white px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
        />
      </div>
    </div>
  );
}

function computeMissingFields(
  kind: "masterClass" | "post",
  form: MasterClassEditorData | PostEditorData
): { key: string; label: string; anchor: string }[] {
  const missing: { key: string; label: string; anchor: string }[] = [];
  let contentBlockCount = 0;
  try {
    const parsed = JSON.parse(form.content);
    contentBlockCount = Array.isArray(parsed?.content) ? parsed.content.length : 0;
  } catch {
    contentBlockCount = 0;
  }

  if (kind === "masterClass") {
    const mc = form as MasterClassEditorData;
    if (!mc.title.trim()) missing.push({ key: "title", label: "Назва", anchor: "field-title" });
    if (!mc.slug) missing.push({ key: "slug", label: "URL (slug)", anchor: "field-slug" });
    if (!mc.summary.trim()) missing.push({ key: "summary", label: "Короткий опис", anchor: "field-summary" });
    if (!mc.coverAssetId) missing.push({ key: "cover", label: "Обкладинка", anchor: "field-cover" });
    else if (!mc.coverAlt.trim()) missing.push({ key: "coverAlt", label: "Alt-текст обкладинки", anchor: "field-coverAlt" });
    if (mc.durationMinutes == null) missing.push({ key: "durationMinutes", label: "Тривалість", anchor: "field-duration" });
    if (contentBlockCount === 0) missing.push({ key: "content", label: "Хоча б один блок вмісту", anchor: "field-content" });
    if (mc.gallery.some((g) => !g.alt.trim()))
      missing.push({ key: "imageAlt", label: "Alt-текст для всіх зображень галереї", anchor: "field-gallery" });
    return missing;
  }
  const post = form as PostEditorData;
  if (!post.title.trim() || post.title.length > 60) missing.push({ key: "title", label: "SEO-назва (≤60)", anchor: "field-title" });
  if (!post.heading.trim()) missing.push({ key: "heading", label: "Заголовок (H1)", anchor: "field-heading" });
  if (!post.description.trim() || post.description.length > 155)
    missing.push({ key: "description", label: "Опис (≤155)", anchor: "field-description" });
  if (contentBlockCount === 0) missing.push({ key: "content", label: "Хоча б один блок вмісту", anchor: "field-content" });
  return missing;
}

export function ContentEditor(props: Props) {
  const kind = props.kind;
  const apiBase = kind === "masterClass" ? "/api/admin/master-classes" : "/api/admin/posts";

  const [form, setForm] = useState<MasterClassEditorData | PostEditorData>(props.data);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "unsaved" | "saving" | "error">("saved");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("content");
  const [contentError, setContentError] = useState<string | null>(null);
  const [coverDialogOpen, setCoverDialogOpen] = useState(false);
  const [galleryDialogOpen, setGalleryDialogOpen] = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [mainPatternTitle, setMainPatternTitle] = useState<string | null>(
    props.kind === "masterClass" ? props.mainPattern?.title ?? null : null
  );
  const [patternDialogOpen, setPatternDialogOpen] = useState(false);

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && tag.length <= 40 && !form.tags.includes(tag) && form.tags.length < 20) {
      updateForm((f) => ({ ...f, tags: [...f.tags, tag] }));
    }
    setTagInput("");
  };

  const didMountRef = useRef(false);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const updateForm = (updater: (f: Form) => Form) => {
    setForm(updater);
    setSaveState("unsaved");
  };

  async function save() {
    setSaveState("saving");
    const payload: Record<string, unknown> = {
      updatedAt: form.updatedAt,
      slug: form.slug,
      lang: form.lang,
      title: form.title,
      tags: form.tags,
      coverAssetId: form.coverAssetId,
      coverAlt: form.coverAlt,
    };
    if (kind === "masterClass") {
      const f = form as MasterClassEditorData;
      payload.translationOfId = f.translationOfId;
      payload.summary = f.summary;
      payload.difficulty = f.difficulty;
      payload.durationMinutes = f.durationMinutes;
      payload.materials = f.materials;
      payload.mainPatternId = f.mainPatternId;
      payload.gallery = f.gallery;
      payload.priceUah = f.priceUah;
      payload.previewBlockCount = f.previewBlockCount;
    } else {
      const f = form as PostEditorData;
      payload.translationOf = f.translationOf;
      payload.heading = f.heading;
      payload.description = f.description;
    }
    try {
      payload.content = JSON.parse(form.content);
      setContentError(null);
    } catch {
      // Не додаємо content у payload — інші поля все одно збережуться.
      setContentError("Некоректний JSON — зміни вмісту не збережено");
    }
    try {
      const res = await fetch(apiBase + "/" + form.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 409) {
        setSaveState("error");
        setErrorMessage("Хтось змінив запис із цим редактором. Оновіть сторінку, щоб продовжити.");
        return;
      }
      if (!res.ok) {
        setSaveState("error");
        setErrorMessage("Не вдалося зберегти зміни");
        return;
      }
      const data = (await res.json()) as { updatedAt?: string };
      setForm((f) => ({ ...f, updatedAt: data.updatedAt ?? f.updatedAt }));
      setSaveState("saved");
      setErrorMessage(null);
    } catch {
      setSaveState("error");
      setErrorMessage("Мережева помилка");
    }
  }
  const saveRef = useRef<() => Promise<void>>(async () => {});
  useEffect(() => {
    saveRef.current = save;
  });

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (form.status !== "DRAFT") return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      void saveRef.current();
    }, 2000);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [form]);

  useEffect(() => {
    if (saveState !== "unsaved" && saveState !== "saving") return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
    };
  }, [saveState]);
  const handleTogglePublish = async () => {
    const wasPublished = form.status === "PUBLISHED";
    setPublishBusy(true);
    try {
      const res = await fetch(apiBase + "/" + form.id + "/publish", {
        method: wasPublished ? "DELETE" : "POST",
      });
      if (res.status === 422) {
        let fields: string[] = [];
        try {
          const data = (await res.json()) as { fields?: unknown };
          if (Array.isArray(data.fields)) fields = data.fields as string[];
        } catch {
          // non-JSON response — показуємо порожній список
        }
        alert("Не вистачає: " + fields.join(", "));
        return;
      }
      if (!res.ok) {
        setSaveState("error");
        setErrorMessage("Не вдалося зберегти зміни");
        return;
      }
      // Publishing bumps the row's updatedAt; without it the next PATCH is rejected as stale (409).
      let updatedAt: string | undefined;
      try {
        updatedAt = ((await res.json()) as { updatedAt?: string }).updatedAt;
      } catch {
        // keep the old value
      }
      if (wasPublished) {
        setForm((f) => ({ ...f, status: "DRAFT", updatedAt: updatedAt ?? f.updatedAt }));
      } else {
        setForm((f) => ({
          ...f,
          status: "PUBLISHED",
          publishedAt: new Date().toISOString(),
          updatedAt: updatedAt ?? f.updatedAt
        }));
      }
    } finally {
      setPublishBusy(false);
    }
  };
  const handleTitleChange = (nextTitle: string) => {
    const autoSlug = !slugTouched && form.publishedAt == null;
    updateForm((f) => {
      const next = autoSlug ? { slug: slugify(nextTitle) } : {};
      if (kind === "masterClass") {
        return { ...(f as MasterClassEditorData), title: nextTitle, ...next };
      }
      return { ...(f as PostEditorData), title: nextTitle, ...next };
    });
  };

  const mc = kind === "masterClass" ? (form as MasterClassEditorData) : null;
  const post = kind === "post" ? (form as PostEditorData) : null;
  const missing = computeMissingFields(kind, form);

  const statusIndicator =
    saveState === "unsaved" ? (
      <span className="text-xs text-gray-400">Не збережено</span>
    ) : saveState === "saving" ? (
      <span className="text-xs text-gray-400">Збереження…</span>
    ) : saveState === "saved" ? (
      <span className="text-xs text-emerald-400">Збережено</span>
    ) : (
      <span title={errorMessage ?? undefined} className="text-xs text-red-400">
        Помилка збереження{errorMessage ? ": " + errorMessage : ""}
      </span>
    );

  const coverPreviewSrc = form.coverAssetId ? "/api/media/" + form.coverAssetId + "/480" : "";
  return (
    <div className="min-h-full bg-gray-950">
      {/* Топбар */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-gray-800 bg-gray-900/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={kind === "masterClass" ? "/admin/master-classes" : "/admin/posts"}
            className="text-sm text-gray-400 hover:text-white"
          >
            ← Список
          </Link>
          <span className="text-white font-medium truncate max-w-[200px]">
            {form.title || "Без назви"}
          </span>
          {statusIndicator}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={(kind === "masterClass" ? "/admin/master-classes/" : "/admin/posts/") + form.id + "/preview"}
            className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium"
          >
            {"Прев'ю"}
          </Link>
          {form.status !== "DRAFT" && (
            <button
              type="button"
              disabled={saveState !== "unsaved"}
              onClick={() => {
                void save();
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium disabled:opacity-50"
            >
              Зберегти зміни
            </button>
          )}
          <button
            type="button"
            disabled={(form.status !== "PUBLISHED" && missing.length > 0) || publishBusy}
            onClick={() => {
              void handleTogglePublish();
            }}
            className={BUTTON_SECONDARY_CLASS}
          >
            {form.status === "PUBLISHED" ? "Зняти з публікації" : "Опублікувати"}
          </button>
        </div>
      </div>

      {/* Мобільні вкладки */}
      <div className="md:hidden flex border-b border-gray-800">
        <button
          type="button"
          onClick={() => setMobileTab("content")}
          className={`flex-1 py-2 text-sm border-b-2 transition-colors ${
            mobileTab === "content" ? "border-indigo-500 text-white" : "border-transparent text-gray-400"
          }`}
        >
          Вміст
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("settings")}
          className={`flex-1 py-2 text-sm border-b-2 transition-colors ${
            mobileTab === "settings" ? "border-indigo-500 text-white" : "border-transparent text-gray-400"
          }`}
        >
          Налаштування
        </button>
      </div>

      <div className="md:grid md:grid-cols-[1fr_360px] gap-6 p-4">
        <main className={mobileTab === "content" ? "block" : "hidden md:block"}>
          <div id="field-content" className="rounded-xl border border-gray-800 p-4 space-y-2">
            <BlockEditor value={form.content} onChange={(json) => updateForm((f) => ({ ...f, content: JSON.stringify(json) }))} />
            {contentError && <p className="text-xs text-red-400">{contentError}</p>}
          </div>
        </main>

        <aside className={(mobileTab === "settings" ? "block" : "hidden md:block") + " space-y-4"}>
          <CollapsiblePanel title="Основне">
            <div className="space-y-3">
              <div>
                <label htmlFor="field-title" className={LABEL_CLASS}>
                  Назва
                </label>
                <input
                  id="field-title"
                  className={INPUT_CLASS}
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="field-slug" className={LABEL_CLASS}>
                  URL
                </label>
                <input
                  id="field-slug"
                  className={INPUT_CLASS}
                  value={form.slug}
                  disabled={form.publishedAt != null}
                  onChange={(e) => {
                    setSlugTouched(true);
                    updateForm((f) => ({ ...f, slug: e.target.value }));
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {form.publishedAt != null
                    ? "Slug заблокований після публікації"
                    : (kind === "masterClass" ? "/master-classes/" : "/blog/") + form.slug}
                </p>
              </div>

              <div>
                <label htmlFor="field-lang" className={LABEL_CLASS}>
                  Мова
                </label>
                <select
                  id="field-lang"
                  className={INPUT_CLASS}
                  value={form.lang}
                  onChange={(e) => {
                    const nextLang = e.target.value as "uk" | "en";
                    if (kind === "masterClass") {
                      updateForm((f) => ({ ...(f as MasterClassEditorData), lang: nextLang, translationOfId: null }));
                    } else {
                      updateForm((f) => ({ ...(f as PostEditorData), lang: nextLang, translationOf: null }));
                    }
                  }}
                >
                  <option value="uk">Українська</option>
                  <option value="en">English</option>
                </select>
              </div>

              {kind === "masterClass" ? (
                <div>
                  <label htmlFor="field-translation" className={LABEL_CLASS}>
                    Переклад
                  </label>
                  <select
                    id="field-translation"
                    className={INPUT_CLASS}
                    value={mc?.translationOfId ?? ""}
                    onChange={(e) =>
                      updateForm((f) => ({ ...(f as MasterClassEditorData), translationOfId: e.target.value || null }))
                    }
                  >
                    <option value="">— Немає —</option>
                    {props.kind === "masterClass" && props.translationPartner && (
                      <option value={props.translationPartner.id}>
                        {props.translationPartner.title} ({props.translationPartner.lang})
                      </option>
                    )}
                  </select>
                </div>
              ) : (
                <div>
                  <label htmlFor="field-translation" className={LABEL_CLASS}>
                    Переклад
                  </label>
                  <input
                    id="field-translation"
                    className={INPUT_CLASS}
                    placeholder="slug статті-парного перекладу (необов'язково)"
                    value={post?.translationOf ?? ""}
                    onChange={(e) =>
                      updateForm((f) => ({ ...(f as PostEditorData), translationOf: e.target.value || null }))
                    }
                  />
                </div>
              )}

              {kind === "masterClass" && (
                <div>
                  <label htmlFor="field-summary" className={LABEL_CLASS}>
                    Короткий опис (summary)
                  </label>
                  <textarea
                    id="field-summary"
                    className={INPUT_CLASS}
                    maxLength={500}
                    rows={3}
                    value={mc?.summary ?? ""}
                    onChange={(e) => updateForm((f) => ({ ...(f as MasterClassEditorData), summary: e.target.value }))}
                  />
                </div>
              )}

              {kind === "post" && (
                <>
                  <div>
                    <label htmlFor="field-heading" className={LABEL_CLASS}>
                      Заголовок (H1)
                    </label>
                    <input
                      id="field-heading"
                      className={INPUT_CLASS}
                      value={post?.heading ?? ""}
                      onChange={(e) => updateForm((f) => ({ ...(f as PostEditorData), heading: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label htmlFor="field-description" className={LABEL_CLASS}>
                      Опис (description, ≤155)
                    </label>
                    <textarea
                      id="field-description"
                      className={INPUT_CLASS}
                      maxLength={155}
                      rows={2}
                      value={post?.description ?? ""}
                      onChange={(e) =>
                        updateForm((f) => ({ ...(f as PostEditorData), description: e.target.value }))
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">{(post?.description ?? "").length}/155</p>
                  </div>
                </>
              )}
            </div>
          </CollapsiblePanel>

          <div id="field-cover">
            <CollapsiblePanel title="Обкладинка">
              <div className="space-y-3">
                {form.coverAssetId ? (
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverPreviewSrc}
                      alt=""
                      className="w-full aspect-video object-cover rounded-lg"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={BUTTON_SECONDARY_CLASS}
                        onClick={() => setCoverDialogOpen(true)}
                      >
                        Змінити
                      </button>
                      <button
                        type="button"
                        className={BUTTON_SECONDARY_CLASS}
                        onClick={() =>
                          updateForm((f) => ({ ...f, coverAssetId: null, coverAlt: "" }))
                        }
                      >
                        Прибрати
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={BUTTON_SECONDARY_CLASS}
                    onClick={() => setCoverDialogOpen(true)}
                  >
                    Завантажити обкладинку
                  </button>
                )}

                <div>
                  <label htmlFor="field-coverAlt" className={LABEL_CLASS}>
                    Alt-текст обкладинки
                    {form.coverAssetId && !form.coverAlt.trim() && (
                      <span className="text-red-400">●</span>
                    )}
                  </label>
                  <input
                    id="field-coverAlt"
                    className={INPUT_CLASS}
                    value={form.coverAlt}
                    placeholder="Опис зображення для alt"
                    onChange={(e) => updateForm((f) => ({ ...f, coverAlt: e.target.value }))}
                  />
                </div>
              </div>
            </CollapsiblePanel>
          </div>

          {props.kind === "masterClass" && (
            <CollapsiblePanel title="Параметри">
              <div className="space-y-3">
                <div>
                  <label className={LABEL_CLASS}>Складність</label>
                  <div className="flex gap-2">
                    {DIFFICULTY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          updateForm((f) => ({ ...(f as MasterClassEditorData), difficulty: opt.value }))
                        }
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          mc?.difficulty === opt.value
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-800 text-gray-400 hover:text-gray-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="field-duration" className={LABEL_CLASS}>
                    Тривалість (хв)
                  </label>
                  <input
                    id="field-duration"
                    type="number"
                    min={1}
                    className={INPUT_CLASS}
                    value={mc?.durationMinutes ?? ""}
                    onChange={(e) =>
                      updateForm((f) => ({
                        ...(f as MasterClassEditorData),
                        durationMinutes: e.target.value === "" ? null : Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
            </CollapsiblePanel>
          )}

          <CollapsiblePanel title="Теги">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-800 px-2.5 py-1 text-xs text-gray-300"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => updateForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))}
                      className="text-gray-500 hover:text-white"
                      aria-label={"Видалити тег " + tag}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className={INPUT_CLASS}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Новий тег, Enter"
                />
                <button type="button" className={BUTTON_SECONDARY_CLASS} onClick={addTag}>
                  + Додати
                </button>
              </div>
            </div>
          </CollapsiblePanel>

          {props.kind === "masterClass" && (
            <CollapsiblePanel title="Основна схема">
              <div className="space-y-2">
                {mc?.mainPatternId ? (
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/patterns/${mc.mainPatternId}/thumbnail`}
                      alt=""
                      className="w-24 h-24 object-contain bg-gray-800 rounded-lg"
                    />
                    <p className="text-sm text-white">{mainPatternTitle ?? mc.mainPatternId}</p>
                    <button
                      type="button"
                      className={BUTTON_SECONDARY_CLASS}
                      onClick={() => {
                        updateForm((f) => ({ ...(f as MasterClassEditorData), mainPatternId: null }));
                        setMainPatternTitle(null);
                      }}
                    >
                      Прибрати
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={BUTTON_SECONDARY_CLASS}
                    onClick={() => setPatternDialogOpen(true)}
                  >
                    Вибрати схему
                  </button>
                )}
              </div>
            </CollapsiblePanel>
          )}

          {props.kind === "masterClass" && (
            <CollapsiblePanel title="Матеріали">
              <div className="space-y-4">
                <MaterialList
                  label="Пряжа"
                  items={mc?.materials.yarn ?? []}
                  onChange={(next) =>
                    updateForm((f) => {
                      const m = f as MasterClassEditorData;
                      return { ...m, materials: { ...m.materials, yarn: next } };
                    })
                  }
                />
                <MaterialList
                  label="Інструменти"
                  items={mc?.materials.tools ?? []}
                  onChange={(next) =>
                    updateForm((f) => {
                      const m = f as MasterClassEditorData;
                      return { ...m, materials: { ...m.materials, tools: next } };
                    })
                  }
                />
                <MaterialList
                  label="Інше"
                  items={mc?.materials.other ?? []}
                  onChange={(next) =>
                    updateForm((f) => {
                      const m = f as MasterClassEditorData;
                      return { ...m, materials: { ...m.materials, other: next } };
                    })
                  }
                />
              </div>
            </CollapsiblePanel>
          )}

          {props.kind === "masterClass" && (
            <div id="field-gallery">
              <CollapsiblePanel title="Галерея">
                <div className="space-y-2">
                  {mc?.gallery.map((item, i) => (
                    <div key={item.assetId + i} className="flex items-start gap-2 border-b border-gray-800 pb-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/media/${item.assetId}/480`}
                        alt=""
                        className="w-16 h-16 object-cover rounded-lg shrink-0"
                      />
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="flex items-center gap-1">
                          <input
                            value={item.alt}
                            onChange={(e) => {
                              const next = mc!.gallery.map((g, idx) => (idx === i ? { ...g, alt: e.target.value } : g));
                              updateForm((f) => ({ ...(f as MasterClassEditorData), gallery: next }));
                            }}
                            placeholder="Alt (обов'язково)"
                            className={INPUT_CLASS + " text-xs"}
                          />
                          {!item.alt.trim() && <span className="text-red-400">●</span>}
                        </div>
                        <input
                          value={item.caption ?? ""}
                          onChange={(e) => {
                            const next = mc!.gallery.map((g, idx) => (idx === i ? { ...g, caption: e.target.value } : g));
                            updateForm((f) => ({ ...(f as MasterClassEditorData), gallery: next }));
                          }}
                          placeholder="Підпис (необов'язково)"
                          className={INPUT_CLASS + " text-xs"}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          disabled={i === 0}
                          onClick={() => {
                            const next = [...mc!.gallery];
                            [next[i - 1], next[i]] = [next[i], next[i - 1]];
                            updateForm((f) => ({ ...(f as MasterClassEditorData), gallery: next }));
                          }}
                          className="text-gray-500 hover:text-white disabled:opacity-30"
                          aria-label="Вище"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={i === mc!.gallery.length - 1}
                          onClick={() => {
                            const next = [...mc!.gallery];
                            [next[i + 1], next[i]] = [next[i], next[i + 1]];
                            updateForm((f) => ({ ...(f as MasterClassEditorData), gallery: next }));
                          }}
                          className="text-gray-500 hover:text-white disabled:opacity-30"
                          aria-label="Нижче"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateForm((f) => ({
                              ...(f as MasterClassEditorData),
                              gallery: mc!.gallery.filter((_, idx) => idx !== i),
                            }))
                          }
                          className="text-red-400 hover:text-red-300"
                          aria-label="Видалити"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className={BUTTON_SECONDARY_CLASS}
                    disabled={(mc?.gallery.length ?? 0) >= 30}
                    onClick={() => setGalleryDialogOpen(true)}
                  >
                    + Додати фото
                  </button>
                </div>
              </CollapsiblePanel>
            </div>
          )}

          {props.kind === "masterClass" && (
            <CollapsiblePanel title="Продаж (скоро)" defaultOpen={false}>
              <p className="text-xs text-gray-500 mb-2">
                Продаж курсів буде доступний пізніше. Поля нижче зарезервовані для майбутнього білінгу і зараз
                недоступні для редагування.
              </p>
              <label className={LABEL_CLASS}>Ціна (копійки)</label>
              <input
                disabled
                value={mc?.priceUah ?? ""}
                placeholder="Ціна (копійки)"
                className="w-full rounded-lg bg-gray-800/50 border border-gray-800 text-gray-500 px-3 py-2 text-sm cursor-not-allowed"
              />
              <label className={LABEL_CLASS}>Безкоштовних блоків</label>
              <input
                disabled
                value={mc?.previewBlockCount ?? 0}
                placeholder="Кількість безкоштовних блоків"
                className="w-full rounded-lg bg-gray-800/50 border border-gray-800 text-gray-500 px-3 py-2 text-sm cursor-not-allowed mt-2"
              />
            </CollapsiblePanel>
          )}

          <CollapsiblePanel title="Чекліст публікації">
            <div className="space-y-0.5">
              {(
                kind === "masterClass"
                  ? [
                      { key: "title", label: "Назва" },
                      { key: "slug", label: "URL (slug)" },
                      { key: "summary", label: "Короткий опис" },
                      { key: "cover", label: "Обкладинка" },
                      { key: "coverAlt", label: "Alt-текст обкладинки" },
                      { key: "durationMinutes", label: "Тривалість" },
                      { key: "content", label: "Хоча б один блок вмісту" },
                      { key: "imageAlt", label: "Alt-текст для всіх зображень галереї" },
                    ]
                  : [
                      { key: "title", label: "SEO-назва (≤60)" },
                      { key: "heading", label: "Заголовок (H1)" },
                      { key: "description", label: "Опис (≤155)" },
                      { key: "content", label: "Хоча б один блок вмісту" },
                    ]
              ).map((entry) => {
                const miss = missing.find((m) => m.key === entry.key);
                return (
                  <button
                    key={entry.key}
                    type="button"
                    onClick={() => {
                      if (miss) {
                        setMobileTab("settings");
                        document.getElementById(miss.anchor)?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }
                    }}
                    className="flex w-full items-center gap-2 py-1 text-left text-sm"
                  >
                    <span className={miss ? "text-red-400" : "text-emerald-400"}>{miss ? "○" : "✓"}</span>
                    <span className={miss ? "text-gray-400" : "text-gray-500 line-through"}>{entry.label}</span>
                  </button>
                );
              })}
            </div>
          </CollapsiblePanel>
        </aside>
      </div>

      <ImageUploadDialog
        open={coverDialogOpen}
        onClose={() => setCoverDialogOpen(false)}
        onSelect={(ids) => {
          const first = ids[0];
          if (first) updateForm((f) => ({ ...f, coverAssetId: first }));
        }}
      />

      <ImageUploadDialog
        open={galleryDialogOpen}
        onClose={() => setGalleryDialogOpen(false)}
        onSelect={(ids) => {
          const room = 30 - (mc?.gallery.length ?? 0);
          const toAdd = ids.slice(0, room).map((assetId) => ({ assetId, alt: "", caption: "" }));
          updateForm((f) => {
            const m = f as MasterClassEditorData;
            return { ...m, gallery: [...m.gallery, ...toAdd] };
          });
        }}
      />

      {props.kind === "masterClass" && (
        <PatternPickerDialog
          open={patternDialogOpen}
          onClose={() => setPatternDialogOpen(false)}
          onSelect={(p) => {
            updateForm((f) => ({ ...(f as MasterClassEditorData), mainPatternId: p.id }));
            setMainPatternTitle(p.title);
          }}
        />
      )}
    </div>
  );
}
