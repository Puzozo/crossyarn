"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (pattern: { id: string; title: string }) => void;
};

type SearchItem = {
  id: string;
  title: string;
  width: number;
  height: number;
  visibility: string;
  thumbnailUrl: string;
};

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export function PatternPickerDialog({ open, onClose, onSelect }: Props) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);
  const requestId = useRef(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Reset the dialog state on the false→true transition (adjust-during-render,
  // so a reopen always starts with a fresh, empty search).
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      setItems([]);
      setLoading(true);
    }
  }

  const fetchPatterns = useCallback(async (value: string) => {
    const id = ++requestId.current;
    const url = value
      ? `/api/admin/patterns/search?q=${encodeURIComponent(value)}`
      : "/api/admin/patterns/search";
    const res = await fetch(url);
    if (!res.ok) return;
    const data = (await res.json()) as { items: SearchItem[] };
    if (id !== requestId.current) return;
    setItems(data.items);
    setLoading(false);
  }, []);

  // On open: fetch the latest patterns (no query).
  useEffect(() => {
    if (!open) return;
    requestId.current += 1;
    fetchPatterns("");
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [open, fetchPatterns]);

  // Focus management: remember the previously active element, focus the first
  // focusable control on open, restore focus on close.
  useEffect(() => {
    if (!open) return;
    lastActiveElement.current = document.activeElement as HTMLElement | null;
    const first = dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    first?.focus();
    return () => {
      lastActiveElement.current?.focus();
    };
  }, [open]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        debounceTimer.current = null;
        fetchPatterns(value.trim());
      }, 300);
    },
    [fetchPatterns]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusables = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusables.length === 0) return;
      event.preventDefault();
      const index = focusables.indexOf(document.activeElement as HTMLElement);
      if (event.shiftKey) {
        const next = index <= 0 ? focusables.length - 1 : index - 1;
        focusables[next].focus();
      } else {
        const next = index === -1 || index === focusables.length - 1 ? 0 : index + 1;
        focusables[next].focus();
      }
    },
    [onClose]
  );

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
        className="w-full max-w-xl rounded-2xl bg-gray-900 border border-gray-800 p-6 shadow-2xl space-y-4"
      >
        <h2 id={titleId} className="text-lg font-semibold text-white">
          Вибір схеми
        </h2>

        <input
          type="text"
          value={query}
          onChange={(event) => handleSearchChange(event.target.value)}
          placeholder="Пошук за назвою схеми..."
          className="w-full rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {loading ? (
          <p className="text-gray-500 text-center py-8">Завантаження…</p>
        ) : items.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {query.trim() ? "Нічого не знайдено" : "Немає доступних публічних схем"}
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 max-h-96 overflow-y-auto">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect({ id: item.id, title: item.title });
                  onClose();
                }}
                className="text-left"
              >
                <div className="relative aspect-square bg-gray-800 rounded-lg overflow-hidden">
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.title}
                    fill
                    unoptimized
                    loading="lazy"
                    className="object-contain p-2"
                  />
                </div>
                <p className="text-sm text-white truncate mt-1">{item.title}</p>
                <p className="text-xs text-gray-500">
                  {item.width} × {item.height}
                </p>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors"
          >
            Скасувати
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
