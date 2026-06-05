"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useState } from "react";

type SymbolEntry = {
  id: string;
  name: string;
  description: string;
  imageData: string;
  width: number;
  height?: number;
};

type BuiltinOverride = {
  name: string;
  description: string;
  imageData: string;
  width: number;
  height: number;
};

export function OfficialSymbolManager({
  initialSymbols,
  builtinSymbols = [],
  initialOverrides = {}
}: {
  initialSymbols: SymbolEntry[];
  builtinSymbols?: SymbolEntry[];
  initialOverrides?: Record<string, BuiltinOverride>;
}) {
  const [symbols, setSymbols] = useState<SymbolEntry[]>(initialSymbols);
  const [overrides, setOverrides] = useState<Record<string, BuiltinOverride>>(initialOverrides);

  // New official symbol form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [width, setWidth] = useState(1);
  const [height, setHeight] = useState(1);
  const [imageData, setImageData] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Builtin edit state
  const [editingBuiltin, setEditingBuiltin] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editWidth, setEditWidth] = useState(1);
  const [editHeight, setEditHeight] = useState(1);
  const [editImageData, setEditImageData] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 300_000) { setError("Файл занадто великий (макс. 300 KB)"); return; }
    const data = await readFile(file);
    setError(null);
    setImageData(data);
  }

  async function handleEditFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 300_000) { setEditError("Файл занадто великий (макс. 300 KB)"); return; }
    const data = await readFile(file);
    setEditError(null);
    setEditImageData(data);
  }

  function readFile(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(String(reader.result));
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
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
      if (!res.ok) { setError(data.error ?? "Помилка при додаванні"); return; }
      setSymbols((prev) => [...prev, data as SymbolEntry]);
      setName(""); setDescription(""); setWidth(1); setHeight(1); setImageData("");
      const form = document.querySelector("form") as HTMLFormElement | null;
      form?.reset();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string, symbolName: string) {
    if (!confirm(`Видалити символ "${symbolName}"?`)) return;
    const res = await fetch(`/api/admin/symbols/${id}`, { method: "DELETE" });
    if (res.ok) setSymbols((prev) => prev.filter((s) => s.id !== id));
  }

  function openEditBuiltin(builtinId: string) {
    const original = builtinSymbols.find((s) => s.id === builtinId)!;
    const override = overrides[builtinId];
    setEditingBuiltin(builtinId);
    setEditName(override?.name ?? original.name);
    setEditDescription(override?.description ?? original.description);
    setEditWidth(override?.width ?? original.width);
    setEditHeight(override?.height ?? original.height ?? 1);
    setEditImageData(override?.imageData ?? original.imageData);
    setEditError(null);
  }

  async function handleSaveBuiltin(e: FormEvent) {
    e.preventDefault();
    if (!editingBuiltin) return;
    setEditError(null);
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/admin/symbols/builtin/${editingBuiltin}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, description: editDescription, imageData: editImageData, width: editWidth, height: editHeight })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setEditError(data.error ?? "Помилка збереження"); return; }
      setOverrides((prev) => ({
        ...prev,
        [editingBuiltin]: { name: editName, description: editDescription, imageData: editImageData, width: editWidth, height: editHeight }
      }));
      setEditingBuiltin(null);
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleResetBuiltin(builtinId: string, symbolName: string) {
    if (!confirm(`Скинути "${symbolName}" до стандартного вигляду?`)) return;
    const res = await fetch(`/api/admin/symbols/builtin/${builtinId}`, { method: "DELETE" });
    if (res.ok) {
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[builtinId];
        return next;
      });
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
              <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Назва позначки" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Опис</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} required maxLength={300}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                placeholder="Короткий опис" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Зображення</label>
              <input type="file" accept="image/*" onChange={handleFile} required
                className="w-full text-sm text-gray-400 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-indigo-500" />
              <p className="text-[10px] text-gray-500">Рекомендовано {width * 64}×{height * 64}px, ≤ 300KB</p>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Ширина (клітинок)</label>
              <select value={width} onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                {[1, 2, 3, 4, 5, 6].map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300">Висота (клітинок)</label>
              <select value={height} onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                {[1, 2, 3, 4, 5, 6].map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
          {imageData && <Image src={imageData} alt="preview" width={64} height={64} className="rounded-lg border border-gray-700 bg-white" />}
          {error && <div className="rounded-lg bg-red-900/40 border border-red-700 px-3 py-2 text-sm text-red-300">{error}</div>}
          <button type="submit" disabled={submitting || !imageData}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors">
            {submitting ? "Збереження..." : "Додати позначку"}
          </button>
        </form>
      </div>

      {/* Official symbols list */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-white">Офіційні позначки ({symbols.length})</h2>
        {symbols.length === 0 ? (
          <p className="text-gray-500 text-sm">Немає офіційних позначок. Додайте першу.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {symbols.map((s) => (
              <div key={s.id} className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 flex items-start gap-4">
                {s.imageData && <Image src={s.imageData} alt={s.name} width={48} height={48} className="rounded-lg border border-gray-700 bg-white shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-white font-medium truncate">{s.name}</div>
                      <div className="text-gray-400 text-sm truncate">{s.description}</div>
                      {s.width > 1 && <span className="text-xs text-indigo-400">{s.width}×{s.height ?? 1} клітинки</span>}
                    </div>
                    <button type="button" onClick={() => void handleDelete(s.id, s.name)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors shrink-0">
                      Видалити
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Built-in symbols */}
      {builtinSymbols.length > 0 && (
        <div className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-white">Вбудовані позначки ({builtinSymbols.length})</h2>
            <p className="text-gray-500 text-xs mt-0.5">Стандартні символи редактора. Зміни зберігаються в БД і діють глобально.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {builtinSymbols.map((s) => {
              const override = overrides[s.id];
              const display = override ?? s;
              const isEditing = editingBuiltin === s.id;

              return (
                <div key={s.id} className={`rounded-xl border p-4 ${override ? "border-amber-700/60 bg-amber-950/20" : "border-gray-700/50 bg-gray-900/30"}`}>
                  {isEditing ? (
                    <form onSubmit={(e) => void handleSaveBuiltin(e)} className="space-y-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">Редагування: {s.name}</span>
                        <button type="button" onClick={() => setEditingBuiltin(null)} className="text-xs text-gray-500 hover:text-gray-300">✕</button>
                      </div>
                      <div className="space-y-2">
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} required maxLength={80}
                          placeholder="Назва" className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500" />
                        <input value={editDescription} onChange={(e) => setEditDescription(e.target.value)} required maxLength={300}
                          placeholder="Опис" className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500" />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-gray-500 block mb-0.5">Ширина</label>
                            <select value={editWidth} onChange={(e) => setEditWidth(Number(e.target.value))}
                              className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500">
                              {[1, 2, 3, 4, 5, 6].map((w) => <option key={w} value={w}>{w}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-500 block mb-0.5">Висота</label>
                            <select value={editHeight} onChange={(e) => setEditHeight(Number(e.target.value))}
                              className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-2 py-1.5 text-sm focus:outline-none focus:border-indigo-500">
                              {[1, 2, 3, 4, 5, 6].map((h) => <option key={h} value={h}>{h}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 block mb-0.5">Зображення (необов&apos;язково)</label>
                          <input type="file" accept="image/*" onChange={handleEditFile}
                            className="w-full text-xs text-gray-400 file:mr-2 file:rounded file:border-0 file:bg-gray-700 file:px-2 file:py-1 file:text-xs file:text-white hover:file:bg-gray-600" />
                          <p className="text-[10px] text-gray-600 mt-0.5">Рекомендовано {editWidth * 64}×{editHeight * 64}px, ≤ 300KB</p>
                        </div>
                        {editImageData && (
                          <Image src={editImageData} alt="preview" width={48} height={48} className="rounded border border-gray-700 bg-white" />
                        )}
                      </div>
                      {editError && <div className="text-xs text-red-400">{editError}</div>}
                      <div className="flex gap-2">
                        <button type="submit" disabled={editSubmitting}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors">
                          {editSubmitting ? "Збереження..." : "Зберегти"}
                        </button>
                        <button type="button" onClick={() => setEditingBuiltin(null)}
                          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold rounded-lg transition-colors">
                          Скасувати
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-start gap-4">
                      {display.imageData && (
                        <Image src={display.imageData} alt={display.name} width={48} height={48}
                          className="rounded-lg border border-gray-700 bg-white shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-200 font-medium truncate">{display.name}</span>
                              {override && <span className="text-[10px] bg-amber-800/60 text-amber-300 px-1.5 py-0.5 rounded">змінено</span>}
                            </div>
                            <div className="text-gray-500 text-sm truncate">{display.description}</div>
                            {display.width > 1 && <span className="text-xs text-indigo-400/70">{display.width}×{(display.height ?? 1)} клітинки</span>}
                            <div className="text-[10px] text-gray-600 mt-0.5">id: {s.id}</div>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <button type="button" onClick={() => openEditBuiltin(s.id)}
                              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                              Редагувати
                            </button>
                            {override && (
                              <button type="button" onClick={() => void handleResetBuiltin(s.id, s.name)}
                                className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                                Скинути
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
