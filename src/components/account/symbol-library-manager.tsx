"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PatternSymbol, SYMBOL_SPAN_OPTIONS } from "@/lib/patterns/model";
import { useTranslation } from "@/lib/i18n/context";
import { apiErrorMessage } from "@/lib/i18n/api-errors";

type Props = {
  initialSymbols: PatternSymbol[];
};

export function SymbolLibraryManager({ initialSymbols }: Props) {
  const { t } = useTranslation();
  const [symbols, setSymbols] = useState(initialSymbols);
  const [imageData, setImageData] = useState<string>("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [width, setWidth] = useState(1);
  const [height, setHeight] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const customSymbols = useMemo(() => symbols.filter((item) => item.source === "user"), [symbols]);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 300_000) {
      setError(t("symbols.imageSizeError"));
      return;
    }
    const image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    setError(null);
    setImageData(image);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const response = await fetch("/api/symbols", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, imageData, width, height })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(apiErrorMessage(t, data, "symbols.addError"));
      return;
    }
    setSymbols((current) => [
      ...current,
      {
        id: `user-${data.id}`,
        label: data.name,
        imageData: data.imageData,
        description: data.description,
        source: "user" as const,
        width: data.width > 1 ? data.width : undefined,
        height: data.height > 1 ? data.height : undefined
      }
    ]);
    setName("");
    setDescription("");
    setImageData("");
    setWidth(1);
    setHeight(1);
  }

  async function handleDelete(symbolId: string) {
    const rawId = symbolId.replace("user-", "");
    const response = await fetch(`/api/symbols/${rawId}`, { method: "DELETE" });
    if (!response.ok) {
      setError(t("symbols.deleteError"));
      return;
    }
    setSymbols((current) => current.filter((item) => item.id !== symbolId));
  }

  async function handleEditSave(symbolId: string) {
    const rawId = symbolId.replace("user-", "");
    setEditError(null);
    const response = await fetch(`/api/symbols/${rawId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), description: editDescription.trim() })
    });
    if (!response.ok) {
      setEditError(t("symbols.editError"));
      return;
    }
    setSymbols((current) =>
      current.map((item) =>
        item.id === symbolId
          ? { ...item, label: editName.trim(), description: editDescription.trim() }
          : item
      )
    );
    setEditTarget(null);
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
            <p className="text-[10px] text-yarn-warm-gray">
              {t("symbols.imageSizeHint", { w: String(width * 64), h: String(height * 64) })}
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-yarn-charcoal">{t("symbols.widthLabel")}</label>
            <select
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-full rounded-lg border border-yarn-sand bg-white px-3 py-2 text-sm text-yarn-charcoal focus:outline-none focus:border-yarn-terracotta"
            >
              {SYMBOL_SPAN_OPTIONS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-yarn-charcoal">{t("symbols.heightLabel")}</label>
            <select
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full rounded-lg border border-yarn-sand bg-white px-3 py-2 text-sm text-yarn-charcoal focus:outline-none focus:border-yarn-terracotta"
            >
              {SYMBOL_SPAN_OPTIONS.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>
        </div>
        {imageData ? (
          <div className="mt-4">
            <Image src={imageData} alt="preview" width={width * 64} height={height * 64} className="max-w-full h-auto max-h-80 rounded-lg border border-yarn-sand object-contain" />
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {customSymbols.map((symbol) => (
              <div key={symbol.id} className="rounded-xl border border-yarn-sand/60 bg-white p-4 flex items-start gap-4">
                {symbol.imageData ? (
                  // Fixed thumbnail box: multi-cell symbols (e.g. 12×1) scale down inside it
                  // instead of stretching the card.
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-yarn-sand bg-white p-1">
                    <Image
                      src={symbol.imageData}
                      alt={symbol.label}
                      width={(symbol.width ?? 1) * 48}
                      height={(symbol.height ?? 1) * 48}
                      className="h-auto max-h-full w-auto max-w-full object-contain"
                    />
                  </div>
                ) : null}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-yarn-charcoal truncate" title={symbol.label}>{symbol.label}</div>
                  <div className="text-sm text-yarn-warm-gray truncate" title={symbol.description}>{symbol.description}</div>
                  {((symbol.width ?? 1) > 1 || (symbol.height ?? 1) > 1) && (
                    <span className="text-xs text-yarn-sage-strong font-semibold">
                      {symbol.width ?? 1}×{symbol.height ?? 1} {t("symbols.cells")}
                    </span>
                  )}
                  {editTarget === symbol.id ? (
                    <form
                      className="mt-2 space-y-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void handleEditSave(symbol.id);
                      }}
                    >
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-yarn-charcoal">{t("symbols.nameLabel")}</label>
                        <Input
                          value={editName}
                          onChange={(event) => setEditName(event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-yarn-charcoal">{t("symbols.descLabel")}</label>
                        <Input
                          value={editDescription}
                          onChange={(event) => setEditDescription(event.target.value)}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button type="submit" size="sm">{t("symbols.saveBtn")}</Button>
                        <Button type="button" variant="secondary" size="sm" onClick={() => setEditTarget(null)}>
                          {t("symbols.cancelBtn")}
                        </Button>
                        {editError ? (
                          <span className="text-sm text-red-600">{editError}</span>
                        ) : null}
                      </div>
                    </form>
                  ) : (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditTarget(symbol.id);
                          setEditName(symbol.label);
                          setEditDescription(symbol.description ?? "");
                          setEditError(null);
                        }}
                      >
                        {t("symbols.editBtn")}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteTarget(symbol.id)}
                      >
                        {t("symbols.deleteBtn")}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmDialog
        open={deleteTarget !== null}
        title={t("symbols.deleteConfirm")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        danger
        onConfirm={() => {
          const target = deleteTarget;
          setDeleteTarget(null);
          if (target) void handleDelete(target);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}
