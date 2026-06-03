"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PatternSymbol } from "@/lib/patterns/model";
import { useTranslation } from "@/lib/i18n/context";

type Props = {
  initialSymbols: PatternSymbol[];
};

export function SymbolLibraryManager({ initialSymbols }: Props) {
  const { t } = useTranslation();
  const [symbols, setSymbols] = useState(initialSymbols);
  const [imageData, setImageData] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const customSymbols = useMemo(() => symbols.filter((item) => item.source === "user"), [symbols]);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const imageElement = document.createElement("img");
    imageElement.src = image;
    await imageElement.decode();
    if (imageElement.width !== 64 || imageElement.height !== 64) {
      setError(t("symbols.imageSizeError"));
      return;
    }
    setError(null);
    setImageData(image);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const response = await fetch("/api/symbols", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, imageData })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error ?? t("symbols.addError"));
      return;
    }
    setSymbols((current) => [
      ...current,
      {
        id: `user-${data.id}`,
        label: data.name,
        imageData: data.imageData,
        description: data.description,
        source: "user"
      }
    ]);
    setName("");
    setDescription("");
    setImageData("");
  }

  async function handleDelete(symbolId: string) {
    if (!confirm(t("symbols.deleteConfirm"))) return;
    const rawId = symbolId.replace("user-", "");
    const response = await fetch(`/api/symbols/${rawId}`, { method: "DELETE" });
    if (!response.ok) {
      setError(t("symbols.deleteError"));
      return;
    }
    setSymbols((current) => current.filter((item) => item.id !== symbolId));
  }

  return (
    <section className="space-y-6 rounded-2xl bg-white/70 border border-yarn-sand/50 p-6 sm:p-8 shadow-warm-sm">
      <div>
        <h2 className="font-display text-xl font-bold text-yarn-charcoal">{t("symbols.title")}</h2>
        <p className="mt-1 text-sm text-yarn-warm-gray">
          {t("symbols.description")}
        </p>
      </div>

      {/* Upload form */}
      <form onSubmit={handleSubmit} className="rounded-xl bg-yarn-oatmeal/40 border border-yarn-sand/40 p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-yarn-charcoal">{t("symbols.nameLabel")}</label>
            <Input value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-yarn-charcoal">{t("symbols.descLabel")}</label>
            <Input value={description} onChange={(event) => setDescription(event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-yarn-charcoal">{t("symbols.iconLabel")}</label>
            <Input type="file" accept="image/*" onChange={handleFile} required />
          </div>
        </div>
        {imageData ? (
          <div className="mt-4">
            <Image src={imageData} alt="preview" width={64} height={64} className="rounded-lg border border-yarn-sand object-contain" />
          </div>
        ) : null}
        <div className="mt-4 flex items-center gap-3">
          <Button type="submit">{t("symbols.addBtn")}</Button>
          {error ? (
            <span className="text-sm text-red-600">{error}</span>
          ) : null}
        </div>
      </form>

      {/* Custom symbols list */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-yarn-warm-gray">{t("symbols.mySymbols")}</h3>
        {customSymbols.length === 0 ? (
          <p className="text-sm text-yarn-warm-gray">{t("symbols.none")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {customSymbols.map((symbol) => (
              <div key={symbol.id} className="rounded-xl border border-yarn-sand/60 bg-white p-4 flex items-start gap-4">
                {symbol.imageData ? (
                  <Image
                    src={symbol.imageData}
                    alt={symbol.label}
                    width={48}
                    height={48}
                    className="rounded-lg border border-yarn-sand object-contain shrink-0"
                  />
                ) : null}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-yarn-charcoal truncate">{symbol.label}</div>
                  <div className="text-sm text-yarn-warm-gray truncate">{symbol.description}</div>
                  <Button
                    className="mt-2"
                    variant="danger"
                    size="sm"
                    onClick={() => void handleDelete(symbol.id)}
                  >
                    {t("symbols.deleteBtn")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
