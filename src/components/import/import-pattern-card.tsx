"use client";

import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";

export function ImportPatternCard() {
  const router = useRouter();
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/imports", {
      method: "POST",
      body: formData
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setError(data?.error ?? t("import.error"));
      setPending(false);
      return;
    }

    const preview = data.resultData;
    const created = await fetch("/api/patterns", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: preview?.suggestedTitle ?? t("import.suggestedTitle"),
        description: t("import.description"),
        width: preview?.pattern?.width ?? 24,
        height: preview?.pattern?.height ?? 24,
        patternData: preview?.pattern
      })
    });

    const createdData = await created.json().catch(() => null);
    setPending(false);

    if (!created.ok || !createdData?.id) {
      setError(t("import.postError"));
      return;
    }

    router.push(`/editor/${createdData.id}`);
    router.refresh();
  }

  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <input type="file" accept="image/*" className="hidden" onChange={handleImport} />
      <Button type="button" variant="secondary" disabled={pending}>
        {pending ? t("patterns.importing") : t("patterns.importBtn")}
      </Button>
      {error ? <span className="text-sm text-red-600">{error}</span> : null}
    </label>
  );
}
