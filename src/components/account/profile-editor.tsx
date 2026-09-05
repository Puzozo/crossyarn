"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
/* eslint-disable @next/next/no-img-element -- avatar preview is a data URI */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n/context";
import { TranslationKey } from "@/lib/i18n/translations";

export type ProfileValues = {
  name: string;
  username: string;
  bio: string;
  location: string;
  website: string;
  avatar: string;
  profilePublic: boolean;
};

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;
const AVATAR_SIZE = 256;

const ERROR_KEYS: Record<string, TranslationKey> = {
  USERNAME_TAKEN: "profile.errUsernameTaken",
  USERNAME_RESERVED: "profile.errUsernameReserved",
  USERNAME_REQUIRED_FOR_PUBLIC: "profile.errUsernameRequired",
  INVALID_WEBSITE: "profile.errWebsite",
  INVALID_AVATAR: "profile.errAvatar"
};

/** Center-crop the picked image to a 256×256 JPEG data URI (client-side, keeps uploads tiny). */
function fileToAvatarDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const side = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - side) / 2;
        const sy = (img.naturalHeight - side) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = AVATAR_SIZE;
        canvas.height = AVATAR_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no canvas");
        ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode failed"));
    };
    img.src = url;
  });
}

export function ProfileEditor({ initial }: { initial: ProfileValues }) {
  const { t } = useTranslation();
  const [values, setValues] = useState<ProfileValues>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarFile(file: File | undefined) {
    if (!file) return;
    try {
      set("avatar", await fileToAvatarDataUri(file));
    } catch {
      setError(t("profile.errAvatar"));
    }
  }

  function set<K extends keyof ProfileValues>(key: K, value: ProfileValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    // Client-side guards for the two most common mistakes (server re-validates).
    if (values.username && !USERNAME_RE.test(values.username.trim())) {
      setError(t("profile.errUsernameFormat"));
      return;
    }
    if (values.profilePublic && !values.username.trim()) {
      setError(t("profile.errUsernameRequired"));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const code: string = data?.error ?? "";
        setError(t(ERROR_KEYS[code] ?? "profile.errGeneric"));
        return;
      }
      // Reflect any server-side normalization (lowercased username, https:// prefix).
      setValues({
        name: data.name ?? "",
        username: data.username ?? "",
        bio: data.bio ?? "",
        location: data.location ?? "",
        website: data.website ?? "",
        avatar: data.avatarData ?? "",
        profilePublic: data.profilePublic
      });
      setSaved(true);
    } catch {
      setError(t("profile.errGeneric"));
    } finally {
      setSaving(false);
    }
  }

  const canViewPublic = values.profilePublic && !!values.username.trim();

  return (
    <section className="max-w-2xl rounded-2xl bg-white/70 border border-yarn-sand/50 p-6 sm:p-8 shadow-warm-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-yarn-charcoal">{t("profile.title")}</h2>
          <p className="mt-1 text-sm text-yarn-warm-gray">{t("profile.desc")}</p>
        </div>
        {canViewPublic ? (
          <Link
            href={`/u/${values.username.trim().toLowerCase()}`}
            className="shrink-0 text-sm font-semibold text-yarn-terracotta hover:text-yarn-terracotta-hover transition-colors"
          >
            {t("profile.viewPublic")} →
          </Link>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <span className="block text-sm font-medium text-yarn-charcoal mb-1.5">{t("profile.avatar")}</span>
          <div className="flex items-center gap-4">
            {values.avatar ? (
              <img
                src={values.avatar}
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 shrink-0 rounded-full object-cover border border-yarn-sand/60"
              />
            ) : (
              <div
                aria-hidden
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-yarn-terracotta/15 text-xl font-bold text-yarn-terracotta"
              >
                {(values.name.trim() || values.username.trim() || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  void handleAvatarFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border border-yarn-sand bg-white px-4 py-2 text-sm font-medium text-yarn-charcoal hover:border-yarn-terracotta/40 hover:bg-yarn-terracotta-light/30 transition-colors"
              >
                {t("profile.avatarChange")}
              </button>
              {values.avatar ? (
                <button
                  type="button"
                  onClick={() => set("avatar", "")}
                  className="text-sm font-medium text-yarn-warm-gray hover:text-red-500 transition-colors"
                >
                  {t("profile.avatarRemove")}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="pf-name" className="block text-sm font-medium text-yarn-charcoal mb-1.5">
            {t("profile.name")}
          </label>
          <Input
            id="pf-name"
            value={values.name}
            maxLength={60}
            placeholder={t("profile.namePlaceholder")}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="pf-username" className="block text-sm font-medium text-yarn-charcoal mb-1.5">
            {t("profile.username")}
          </label>
          <div className="flex items-stretch rounded-xl border border-yarn-sand bg-white overflow-hidden focus-within:border-yarn-terracotta focus-within:ring-2 focus-within:ring-yarn-terracotta-light transition-all">
            <span className="flex items-center px-3 text-sm text-yarn-warm-gray bg-yarn-oatmeal/50 border-r border-yarn-sand select-none">
              /u/
            </span>
            <input
              id="pf-username"
              value={values.username}
              maxLength={30}
              placeholder={t("profile.usernamePlaceholder")}
              onChange={(e) => set("username", e.target.value.replace(/\s/g, ""))}
              className="w-full bg-transparent px-3 py-3 text-sm text-yarn-charcoal placeholder:text-yarn-warm-gray outline-none"
            />
          </div>
          <p className="mt-1.5 text-xs text-yarn-warm-gray">
            {t("profile.usernameHint", { username: values.username.trim().toLowerCase() || "нікнейм" })}
          </p>
        </div>

        <div>
          <label htmlFor="pf-bio" className="block text-sm font-medium text-yarn-charcoal mb-1.5">
            {t("profile.bio")}
          </label>
          <textarea
            id="pf-bio"
            value={values.bio}
            maxLength={300}
            rows={3}
            placeholder={t("profile.bioPlaceholder")}
            onChange={(e) => set("bio", e.target.value)}
            className="w-full rounded-xl border border-yarn-sand bg-white px-4 py-3 text-sm text-yarn-charcoal placeholder:text-yarn-warm-gray outline-none transition-all duration-200 resize-y focus:border-yarn-terracotta focus:bg-yarn-oatmeal/30 focus:ring-2 focus:ring-yarn-terracotta-light"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-location" className="block text-sm font-medium text-yarn-charcoal mb-1.5">
              {t("profile.location")}
            </label>
            <Input
              id="pf-location"
              value={values.location}
              maxLength={80}
              placeholder={t("profile.locationPlaceholder")}
              onChange={(e) => set("location", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="pf-website" className="block text-sm font-medium text-yarn-charcoal mb-1.5">
              {t("profile.website")}
            </label>
            <Input
              id="pf-website"
              type="url"
              inputMode="url"
              value={values.website}
              maxLength={200}
              placeholder={t("profile.websitePlaceholder")}
              onChange={(e) => set("website", e.target.value)}
            />
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-yarn-sand/60 bg-yarn-oatmeal/30 p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={values.profilePublic}
            onChange={(e) => set("profilePublic", e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-yarn-terracotta"
          />
          <span>
            <span className="block text-sm font-medium text-yarn-charcoal">{t("profile.public")}</span>
            <span className="mt-0.5 block text-xs text-yarn-warm-gray">{t("profile.publicHint")}</span>
          </span>
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? t("profile.saving") : t("profile.save")}
          </Button>
          {saved ? <span className="text-sm font-medium text-yarn-sage">{t("profile.saved")}</span> : null}
        </div>
      </form>
    </section>
  );
}
