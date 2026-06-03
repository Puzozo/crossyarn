"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n/context";

export function CreatePatternButton() {
  const router = useRouter();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? t("create.defaultName"));
    const width = Number(formData.get("width") ?? 24);
    const height = Number(formData.get("height") ?? 24);

    const response = await fetch("/api/patterns", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        description: "",
        width,
        height
      })
    });

    const data = await response.json().catch(() => null);
    setPending(false);

    if (!response.ok || !data?.id) {
      setError(t("create.error"));
      return;
    }

    setOpen(false);
    router.push(`/editor/${data.id}`);
    router.refresh();
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}>{t("patterns.createBtn")}</Button>;
  }

  return (
    <form
      onSubmit={handleCreate}
      className="flex flex-wrap items-end gap-3 rounded-2xl bg-white/80 backdrop-blur border border-yarn-sand/50 p-4 shadow-warm"
    >
      <div className="min-w-44">
        <label className="mb-1.5 block text-xs font-medium text-yarn-warm-gray">{t("create.title")}</label>
        <Input name="title" defaultValue={t("create.defaultName")} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-yarn-warm-gray">{t("create.stitches")}</label>
        <Input name="width" type="number" min={1} max={200} defaultValue={24} className="w-24" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-yarn-warm-gray">{t("create.rows")}</label>
        <Input name="height" type="number" min={1} max={200} defaultValue={24} className="w-24" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? t("create.creating") : t("create.submit")}
      </Button>
      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
        {t("create.cancel")}
      </Button>
      {error ? <span className="text-sm text-red-600">{error}</span> : null}
    </form>
  );
}
