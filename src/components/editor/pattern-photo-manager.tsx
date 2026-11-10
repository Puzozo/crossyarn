"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { GalleryLightbox } from "@/components/content/gallery-lightbox";
import { useTranslation } from "@/lib/i18n/context";

export type PatternPhoto = { assetId: string; alt: string };

type Props = {
  patternId: string;
  title: string;
  description: string | null;
  initialPhotos: PatternPhoto[];
};

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function PatternPhotoManager({ patternId, title, description, initialPhotos }: Props) {
  const { t, lang } = useTranslation();
  const [photos, setPhotos] = useState<PatternPhoto[]>(initialPhotos);
  const [error, setError] = useState<string | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [draftAlts, setDraftAlts] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function persist(next: PatternPhoto[]) {
    const prev = photos;
    setPhotos(next);
    const res = await fetch(`/api/patterns/${patternId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: description ?? "", photos: next }),
    });
    if (!res.ok) {
      setPhotos(prev);
      setError(t("editor.photoSaveError"));
    } else {
      setError(null);
    }
  }

  function movePhoto(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= photos.length) return;
    const next = [...photos];
    [next[i], next[j]] = [next[j], next[i]];
    void persist(next);
  }

  function removePhoto(i: number) {
    const next = photos.filter((_, idx) => idx !== i);
    setDraftAlts({});
    void persist(next);
  }

  async function uploadFile(file: File) {
    setUploadingCount((c) => c + 1);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/media", { method: "POST", body: formData });
      const data: { id?: unknown; error?: unknown } = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.id !== "string") {
        let key: Parameters<typeof t>[0];
        if (data.error === "INVALID_FORMAT") key = "editor.photoErrorInvalidFormat";
        else if (data.error === "IMAGE_TOO_LARGE") key = "editor.photoErrorTooLarge";
        else if (data.error === "MEDIA_QUOTA_EXCEEDED") key = "editor.photoErrorQuota";
        else if (data.error === "MEDIA_STORAGE_EXCEEDED") key = "editor.photoErrorStorage";
        else key = "editor.photoErrorGeneric";
        setError(t(key));
        return;
      }
      const next = [...photos, { assetId: data.id, alt: "" }];
      await persist(next);
    } finally {
      setUploadingCount((c) => c - 1);
    }
  }

  function onFilesChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    let pending = photos.length;
    for (const file of files) {
      if (pending >= 5) break;
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(t("editor.photoErrorInvalidFormat"));
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(t("editor.photoErrorTooLarge"));
        continue;
      }
      pending += 1;
      void uploadFile(file);
    }
  }

  function onAltBlur(assetId: string, i: number) {
    const draft = draftAlts[assetId];
    if (draft === undefined) return;
    setDraftAlts((d) => {
      const copy = { ...d };
      delete copy[assetId];
      return copy;
    });
    if (draft !== photos[i]?.alt) {
      void persist(photos.map((p, idx) => (idx === i ? { ...p, alt: draft } : p)));
    }
  }

  return (
    <div className="rounded-2xl bg-white/70 border border-yarn-sand/50 p-4 space-y-3 shadow-warm-sm">
      <h3 className="font-display text-sm font-semibold text-yarn-charcoal">{t("editor.photosTitle")}</h3>
      <p className="text-xs text-yarn-warm-gray">{t("editor.photosHint")}</p>

      {photos.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {photos.map((p, i) => (
            <div key={p.assetId} className="flex flex-col items-center gap-1.5">
              <button type="button" onClick={() => setLightboxIndex(i)} className="block cursor-pointer">
                {/* eslint-disable-next-line @next/next/no-img-element -- pre-generated WebP variant served from /api/media */}
                <img src={`/api/media/${p.assetId}/480`} alt={p.alt || title} className="h-24 w-24 rounded-lg object-cover" />
              </button>
              <input
                type="text"
                value={draftAlts[p.assetId] ?? p.alt}
                placeholder={t("editor.photoAltPlaceholder")}
                maxLength={200}
                onChange={(e) => setDraftAlts((d) => ({ ...d, [p.assetId]: e.target.value }))}
                onBlur={() => onAltBlur(p.assetId, i)}
                className="w-24 rounded-md border border-yarn-sand bg-white px-1.5 py-1 text-[11px] text-yarn-charcoal focus:outline-none focus:border-yarn-terracotta"
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => movePhoto(i, -1)}
                  disabled={i === 0}
                  aria-label={t("editor.photoMoveLeft")}
                  className="rounded-md px-1 py-0.5 text-[11px] text-yarn-warm-gray hover:bg-yarn-oatmeal disabled:opacity-40"
                >
                  ◀
                </button>
                <button
                  type="button"
                  onClick={() => movePhoto(i, 1)}
                  disabled={i === photos.length - 1}
                  aria-label={t("editor.photoMoveRight")}
                  className="rounded-md px-1 py-0.5 text-[11px] text-yarn-warm-gray hover:bg-yarn-oatmeal disabled:opacity-40"
                >
                  ▶
                </button>
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label={t("editor.photoRemove")}
                  className="rounded-md px-1 py-0.5 text-[11px] text-yarn-warm-gray hover:bg-yarn-oatmeal hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {photos.length < 5 ? (
        <div>
          <Button type="button" variant="secondary" size="sm" disabled={uploadingCount > 0} onClick={() => fileInputRef.current?.click()}>
            {uploadingCount > 0 ? t("editor.photoUploading") : t("editor.photoUpload")}
          </Button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={onFilesChange} />
        </div>
      ) : (
        <p className="text-xs text-yarn-warm-gray">{t("editor.photoMax")}</p>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {lightboxIndex !== null && (
        <GalleryLightbox
          items={photos.map((p) => ({ assetId: p.assetId, alt: p.alt || title }))}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(next) => setLightboxIndex(next)}
          lang={lang}
        />
      )}
    </div>
  );
}