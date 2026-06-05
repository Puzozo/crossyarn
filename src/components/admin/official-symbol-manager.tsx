"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useState } from "react";

type Symbol = {
  id: string;
  name: string;
  description: string;
  imageData: string;
  width: number;
};

export function OfficialSymbolManager({ initialSymbols }: { initialSymbols: Symbol[] }) {
  const [symbols, setSymbols] = useState(initialSymbols);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [width, setWidth] = useState(1);
  const [height, setHeight] = useState(1);
  const [imageData, setImageData] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 300_000) {
      setError("Файл занадто великий (макс. 300 KB)");
      return;
    }
    const data = await new Promise<string>((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(String(reader.result));
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
    setError(null);
    setImageData(data);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/symbols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, imageData, width, height })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Помилка при додаванні");
        return;
      }
      setSymbols((prev) => [...prev, data]);
      setName("");
      setDescription("");
      setWidth(1);
      setHeight(1);
      setImageData("");
      const form = document.querySelector("form") as HTMLFormElement | null;
      form?.reset();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, symbolName: string) {
    if (!confirm(`Видалити символ "${symbolName}"?`)) return;
    const res = await fetch(`/api/admin/symbols/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSymbols((prev) => prev.filter((s) => s.id !== id));
    }
  }

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5">
        <h2 className="text-base font-semibold text-white mb-4">Додати символ</h2>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Назва</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Назва позначки"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Опис</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                maxLength={300}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Короткий опис"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Зображення</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                required
                className="w-full text-sm text-gray-400 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-indigo-500"
              />
              <p className="text-[10px] text-gray-500">Рекомендовано {width * 64}×{height * 64}px, ≤ 300KB</p>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Ширина (клітинок)</label>
              <select
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                {[1, 2, 3, 4, 5, 6].map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Висота (клітинок)</label>
              <select
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                {[1, 2, 3, 4, 5, 6].map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          {imageData && (
            <Image src={imageData} alt="preview" width={64} height={64} className="rounded-lg border border-gray-700 bg-white" />
          )}

          {error && (
            <div className="rounded-lg bg-red-900/40 border border-red-700 px-3 py-2 text-sm text-red-300">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting || !imageData}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {submitting ? "Збереження..." : "Додати позначку"}
          </button>
        </form>
      </div>

      {/* Symbols list */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white">
          Офіційні позначки ({symbols.length})
        </h2>
        {symbols.length === 0 ? (
          <p className="text-gray-500 text-sm">Немає офіційних позначок. Додайте першу.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {symbols.map((s) => (
              <div key={s.id} className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 flex items-start gap-4">
                {s.imageData && (
                  <Image
                    src={s.imageData}
                    alt={s.name}
                    width={48}
                    height={48}
                    className="rounded-lg border border-gray-700 bg-white shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-white font-medium truncate">{s.name}</div>
                      <div className="text-gray-400 text-sm truncate">{s.description}</div>
                      {s.width > 1 && (
                        <span className="text-xs text-indigo-400">×{s.width} клітинки</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDelete(s.id, s.name)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors shrink-0"
                    >
                      Видалити
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
