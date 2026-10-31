"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateMasterClassButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/master-classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang: "uk", title: title.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        router.push("/admin/master-classes/" + data.id);
      } else {
        alert("Не вдалося створити запис");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        + Створити
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Назва майстер-класу"
        className="rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:border-indigo-500"
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleCreate()}
        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Створити
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="px-3 py-2 text-gray-400 hover:text-white text-sm"
      >
        Скасувати
      </button>
    </div>
  );
}
