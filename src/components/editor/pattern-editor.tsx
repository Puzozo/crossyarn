"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { PatternDocument } from "@/lib/patterns/model";
import { usePatternEditorStore } from "@/lib/patterns/editor-state";
import { useTranslation } from "@/lib/i18n/context";
import { apiErrorMessage } from "@/lib/i18n/api-errors";
import { TranslationKey } from "@/lib/i18n/translations";
import { VersionHistory } from "./version-history";
import { EditorToolbar, SaveState } from "./editor-toolbar";
import { CollapsiblePanel } from "@/components/ui/collapsible-panel";

type Props = {
  patternId: string;
  initialPattern: PatternDocument;
  title: string;
  description: string | null;
  initialTags: string[];
};

function inSelectionRect(
  r: number,
  c: number,
  start: [number, number] | null,
  end: [number, number] | null
): boolean {
  if (!start || !end) return false;
  const r1 = Math.min(start[0], end[0]);
  const r2 = Math.max(start[0], end[0]);
  const c1 = Math.min(start[1], end[1]);
  const c2 = Math.max(start[1], end[1]);
  return r >= r1 && r <= r2 && c >= c1 && c <= c2;
}

export function PatternEditor({ patternId, initialPattern, title, description, initialTags }: Props) {
  const {
    pattern,
    setPattern,
    paintCell,
    undo,
    redo,
    selectedColor,
    selectedSymbolId,
    setSelectedColor,
    setSelectedSymbolId,
    setSymbols,
    resizePattern,
    addEdge,
    removeEdge,
    toggleSkipPurlRows,
    toastData,
    clearToast,
    isSelectionMode,
    isSelecting,
    selectionStart,
    selectionEnd,
    rapportInsertId,
    toggleSelectionMode,
    startSelection,
    updateSelection,
    endSelection,
    saveSelectionAsRapport,
    deleteRapport,
    startRapportInsert,
    cancelRapportInsert,
    insertRapport,
    zoomLevel,
    setZoom,
    rapportMirror,
    setRapportMirror,
    isFillMode,
    toggleFillMode,
    fillCells
  } = usePatternEditorStore();
  const { t } = useTranslation();
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [resizing, setResizing] = useState(false);
  const [draftWidth, setDraftWidth] = useState(0);
  const [draftHeight, setDraftHeight] = useState(0);
  const initializedRef = useRef(false);
  const [availableSymbols, setAvailableSymbols] = useState(initialPattern.symbols);
  const [rapportNameInput, setRapportNameInput] = useState("");
  const [editingSymbolId, setEditingSymbolId] = useState<string | null>(null);

  // Tag management
  const [tags, setTags] = useState<string[]>(initialTags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [tagLoading, setTagLoading] = useState(false);
  const [tagError, setTagError] = useState<string | null>(null);

  const addTag = useCallback(async () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag || tagLoading || tags.includes(tag)) {
      setTagInput("");
      return;
    }
    setTagError(null);
    setTagLoading(true);
    try {
      const res = await fetch(`/api/patterns/${patternId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag })
      });
      if (res.ok) {
        const data = await res.json();
        setTags(data.tags);
        setTagInput("");
      } else {
        // Keep the typed tag so the user can fix it.
        setTagError(apiErrorMessage(t, await res.json().catch(() => null), "auth.genericError"));
      }
    } catch { /* optimist */ }
    setTagLoading(false);
  }, [tagInput, tagLoading, tags, patternId, t]);

  const removeTag = useCallback(async (tag: string) => {
    setTagLoading(true);
    try {
      const res = await fetch(`/api/patterns/${patternId}/tags`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag })
      });
      if (res.ok) {
        const data = await res.json();
        setTags(data.tags);
      }
    } catch { /* optimist */ }
    setTagLoading(false);
  }, [patternId]);

  const handleRenameSymbol = useCallback(
    async (id: string, rawName: string) => {
      setEditingSymbolId(null);
      const name = rawName.trim();
      const current = availableSymbols.find((s) => s.id === id);
      if (!name || !current || name === current.label) return;

      const before = availableSymbols;
      const updated = before.map((s) => (s.id === id ? { ...s, label: name } : s));
      setAvailableSymbols(updated);
      setSymbols(updated);
      try {
        const res = await fetch(`/api/symbols/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name })
        });
        if (!res.ok) throw new Error("rename failed");
      } catch {
        setAvailableSymbols(before);
        setSymbols(before);
      }
    },
    [availableSymbols, setSymbols]
  );

  useEffect(() => {
    if (toastData) {
      const timer = setTimeout(clearToast, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastData, clearToast]);

  useEffect(() => {
    setPattern(initialPattern);
  }, [initialPattern, setPattern]);

  // One-shot toast left by the page that sent us here (version restore reloads,
  // import save redirects) — shown once, then cleared.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("crossyarn:toast");
      if (!raw) return;
      sessionStorage.removeItem("crossyarn:toast");
      const parsed = JSON.parse(raw) as { key?: unknown; params?: unknown };
      if (typeof parsed.key !== "string") return;
      const params =
        parsed.params && typeof parsed.params === "object"
          ? (parsed.params as Record<string, string | number>)
          : undefined;
      usePatternEditorStore.setState({ toastData: { key: parsed.key, params } });
    } catch {
      /* storage unavailable or bad JSON */
    }
  }, []);

  const symbolsLoadedRef = useRef(false);
  useEffect(() => {
    if (symbolsLoadedRef.current || !pattern) return;
    symbolsLoadedRef.current = true;
    void fetch("/api/symbols")
      .then((r) => r.json())
      .then((fetched) => {
        if (Array.isArray(fetched)) {
          setAvailableSymbols(fetched);
          const fetchedIds = new Set(fetched.map((s: { id: string }) => s.id));
          const documentOnly = (pattern?.symbols ?? []).filter((s) => !fetchedIds.has(s.id));
          setSymbols([...fetched, ...documentOnly]);
        }
      })
      .catch(() => undefined);
  }, [pattern, setSymbols]);

  // dirtyRef: an edit is waiting for (or failed) autosave — guards tab close and
  // lets Ctrl+S flush it immediately instead of waiting for the debounce.
  const dirtyRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushSaveRef = useRef<() => void>(() => {});

  const handleSave = useCallback(
    async (documentToSave: PatternDocument) => {
      setSaveState("autosaving");
      try {
        const response = await fetch(`/api/patterns/${patternId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: patternId, title, description: description ?? "", width: documentToSave.width, height: documentToSave.height, patternData: documentToSave })
        });
        setSaveState(response.ok ? "saved" : "error");
        if (response.ok) dirtyRef.current = false;
      } catch {
        setSaveState("error");
      }
    },
    [description, patternId, title]
  );

  useEffect(() => {
    if (!pattern) return;
    if (!initializedRef.current) { initializedRef.current = true; return; }
    dirtyRef.current = true;
    saveTimerRef.current = setTimeout(() => { saveTimerRef.current = null; void handleSave(pattern); }, 1200);
    flushSaveRef.current = () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      void handleSave(pattern);
    };
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [handleSave, pattern]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const availableSymbolsRef = useRef(availableSymbols);
  useEffect(() => { availableSymbolsRef.current = availableSymbols; }, [availableSymbols]);

  // Ctrl+Scroll zoom on the grid area (native listener — React's onWheel is passive)
  const gridSectionRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = gridSectionRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const store = usePatternEditorStore.getState();
      store.setZoom(store.zoomLevel + (e.deltaY < 0 ? 0.1 : -0.1));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Keyboard shortcuts: Ctrl+S save, Ctrl+Z/Y undo/redo, Esc cancel modes, 1-9 symbol pick, +/- zoom
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Before the input guard: Ctrl+S should save (not open "Save page") anywhere.
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        flushSaveRef.current();
        return;
      }
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) {
        return;
      }
      const store = usePatternEditorStore.getState();
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault(); store.undo(); return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
        e.preventDefault(); store.redo(); return;
      }
      if (e.key === "Escape") {
        if (store.rapportInsertId) store.cancelRapportInsert();
        if (store.isSelectionMode) store.toggleSelectionMode();
        if (store.isFillMode) store.toggleFillMode();
        return;
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === "f") {
        store.toggleFillMode();
        return;
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey && /^[1-9]$/.test(e.key)) {
        const idx = Number(e.key) - 1;
        const symbol = availableSymbolsRef.current[idx];
        if (symbol) store.setSelectedSymbolId(symbol.id);
        return;
      }
      if (!e.ctrlKey && !e.metaKey && (e.key === "+" || e.key === "=")) {
        store.setZoom(store.zoomLevel + 0.2); return;
      }
      if (!e.ctrlKey && !e.metaKey && e.key === "-") {
        store.setZoom(store.zoomLevel - 0.2); return;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!pattern) return null;

  const saveLabel =
    saveState === "saved" ? t("editor.saved")
    : saveState === "saving" ? t("editor.saving")
    : saveState === "autosaving" ? t("editor.autosaving")
    : t("editor.error");

  const rapports = pattern.rapports ?? [];
  const activeRapport = rapports.find((r) => r.id === rapportInsertId) ?? null;
  const hasSelection = selectionStart !== null && selectionEnd !== null && !isSelecting;

  // When skipPurlRows is on, only odd-numbered rows are shown (row number = height - rowIndex)
  const skipPurl = pattern.view.skipPurlRows ?? false;
  const visibleRowIndexes = Array.from({ length: pattern.height }, (_, i) => i)
    .filter((i) => !skipPurl || (pattern.height - i) % 2 === 1);

  const cellPx = Math.round(40 * zoomLevel);

  // Grid columns = width + the row-number column; ~90px go to the section padding
  // and the +/- edge buttons. setZoom clamps to its 40%..250% range.
  const fitZoomToWidth = () => {
    const section = gridSectionRef.current;
    if (!section) return;
    const available = section.clientWidth - 90;
    setZoom(available / ((pattern.width + 1) * 40));
  };

  return (
    <div className="grid gap-4 lg:gap-6 lg:grid-cols-[300px_1fr]">
      {/* Sidebar */}
      <aside className="space-y-4 rounded-2xl bg-white/70 border border-yarn-sand/50 p-4 lg:p-5 shadow-warm-sm">
        <h2 className="font-display text-lg font-semibold text-yarn-charcoal">{t("editor.tools")}</h2>

        {/* Grid size / resize */}
        {resizing ? (
          <div className="rounded-xl bg-yarn-oatmeal/60 p-3 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-yarn-warm-gray">{t("editor.resize")}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-yarn-warm-gray">{t("editor.widthLabel")}</label>
                <input type="number" min={1} max={200} value={draftWidth}
                  onChange={(e) => setDraftWidth(Math.max(1, Math.min(200, Number(e.target.value))))}
                  className="w-full rounded-lg border border-yarn-sand bg-white px-2 py-1.5 text-sm font-mono text-yarn-charcoal focus:outline-none focus:border-yarn-terracotta" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-yarn-warm-gray">{t("editor.heightLabel")}</label>
                <input type="number" min={1} max={200} value={draftHeight}
                  onChange={(e) => setDraftHeight(Math.max(1, Math.min(200, Number(e.target.value))))}
                  className="w-full rounded-lg border border-yarn-sand bg-white px-2 py-1.5 text-sm font-mono text-yarn-charcoal focus:outline-none focus:border-yarn-terracotta" />
              </div>
            </div>
            {(draftWidth < pattern.width || draftHeight < pattern.height) && (
              <p className="text-[10px] text-amber-600">{t("editor.resizeWarning")}</p>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => { resizePattern(draftWidth, draftHeight); setResizing(false); }}
                className="flex-1 rounded-lg bg-yarn-terracotta text-white text-xs font-semibold py-1.5 hover:bg-yarn-terracotta-hover transition-colors">
                {t("editor.resizeApply")}
              </button>
              <button type="button" onClick={() => setResizing(false)}
                className="flex-1 rounded-lg bg-yarn-sand/60 text-yarn-charcoal text-xs font-semibold py-1.5 hover:bg-yarn-sand transition-colors">
                {t("editor.cancelEdit")}
              </button>
            </div>
          </div>
        ) : (
          <button type="button"
            onClick={() => { setDraftWidth(pattern.width); setDraftHeight(pattern.height); setResizing(true); }}
            className="flex w-full items-center justify-between rounded-xl bg-yarn-oatmeal/60 p-3 text-sm text-yarn-charcoal font-mono hover:bg-yarn-oatmeal transition-colors">
            <span>{t("editor.stitches")}: {pattern.width}</span>
            <span className="text-yarn-sand">|</span>
            <span>{t("editor.rows")}: {pattern.height}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="ml-1 text-yarn-warm-gray">
              <path d="M1 1h4M1 1v4M11 11H7M11 11V7" />
            </svg>
          </button>
        )}

        {/* View options */}
        <button type="button" onClick={toggleSkipPurlRows}
          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
            pattern.view.skipPurlRows
              ? "bg-yarn-terracotta-light text-yarn-terracotta border border-yarn-terracotta/30"
              : "bg-yarn-oatmeal/60 text-yarn-charcoal hover:bg-yarn-oatmeal"
          }`}>
          <span className="font-mono text-sm leading-none">{pattern.view.skipPurlRows ? "1 3 5" : "1 2 3"}</span>
          {t("editor.skipPurlRows")}
        </button>

        {/* Symbols */}
        <CollapsiblePanel title={t("editor.symbols")}>
        <div className="space-y-2">
          <div className="flex max-h-56 lg:max-h-80 flex-wrap gap-1.5 overflow-auto">
            {availableSymbols.map((symbol) => {
              const isUser = symbol.source === "user" || symbol.id.startsWith("user-");
              const isUnknown = isUser && /^unknown/i.test(symbol.label);

              if (editingSymbolId === symbol.id) {
                return (
                  <div key={symbol.id} className="rounded-lg border border-yarn-terracotta bg-white px-2.5 py-1.5">
                    <input
                      autoFocus
                      defaultValue={symbol.label}
                      onBlur={(e) => void handleRenameSymbol(symbol.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") setEditingSymbolId(null);
                      }}
                      className="w-24 bg-transparent text-xs text-yarn-charcoal outline-none"
                    />
                  </div>
                );
              }

              return (
                <div key={symbol.id} className="group relative">
                  <button type="button" onClick={() => setSelectedSymbolId(symbol.id)}
                    className={`rounded-lg border px-2.5 py-1.5 text-sm transition-all duration-150 ${
                      selectedSymbolId === symbol.id
                        ? "border-yarn-terracotta bg-yarn-terracotta-light text-yarn-terracotta shadow-warm-sm"
                        : "border-yarn-sand/60 bg-white hover:border-yarn-terracotta/40 hover:bg-yarn-terracotta-light/30"
                    }`}
                    title={symbol.description}>
                    <span className="flex items-center gap-1.5">
                      {symbol.imageData ? (
                        <Image src={symbol.imageData} alt={symbol.label} width={20} height={20} className="object-contain" />
                      ) : (
                        <span className="inline-flex min-w-5 justify-center font-mono">{symbol.glyph}</span>
                      )}
                      <span className="text-xs">{symbol.label}</span>
                      {isUnknown && (
                        <span className="rounded-full bg-amber-100 px-1 py-0.5 text-[9px] font-bold text-amber-700">?</span>
                      )}
                      {((symbol.width ?? 1) > 1 || (symbol.height ?? 1) > 1) && (
                        <span className="ml-0.5 rounded bg-yarn-sage-light px-1 py-0.5 text-[9px] font-bold text-yarn-sage">
                          {symbol.width ?? 1}×{symbol.height ?? 1}
                        </span>
                      )}
                    </span>
                  </button>
                  {isUser && (
                    <button type="button"
                      onClick={(e) => { e.stopPropagation(); setEditingSymbolId(symbol.id); }}
                      title={t("editor.renameSymbol")}
                      aria-label={t("editor.renameSymbol")}
                      className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full border border-yarn-sand bg-white text-[9px] text-yarn-warm-gray shadow-sm hover:text-yarn-terracotta group-hover:flex before:absolute before:-inset-1.5 before:content-['']">
                      ✎
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        </CollapsiblePanel>

        {/* Palette */}
        <CollapsiblePanel title={t("editor.palette")}>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {pattern.palette.map((color) => (
              <button key={color.id} type="button" title={color.name} onClick={() => setSelectedColor(color.hex)}
                className={`h-9 w-9 rounded-full border-[3px] transition-all duration-150 hover:scale-110 ${
                  selectedColor === color.hex ? "border-yarn-charcoal scale-110 shadow-warm" : "border-white shadow-warm-sm"
                }`}
                style={{ backgroundColor: color.hex }} />
            ))}
          </div>
        </div>
        </CollapsiblePanel>

        {/* Tags */}
        <CollapsiblePanel title={t("editor.tags")} defaultOpen={false}>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-yarn-oatmeal/80 px-2 py-0.5 text-[11px] font-medium text-yarn-charcoal"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  disabled={tagLoading}
                  title={t("editor.tagRemove")}
                  aria-label={t("editor.tagRemove")}
                  className="relative text-yarn-warm-gray/50 hover:text-red-400 transition-colors leading-none disabled:opacity-40 before:absolute before:-inset-2.5 before:content-['']"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input
              type="text"
              maxLength={40}
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setTagError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void addTag();
              }}
              placeholder={t("editor.tagPlaceholder")}
              disabled={tagLoading}
              className="flex-1 rounded-lg border border-yarn-sand bg-white px-2.5 py-1.5 text-xs text-yarn-charcoal placeholder:text-yarn-warm-gray/60 focus:outline-none focus:border-yarn-terracotta disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => void addTag()}
              disabled={tagLoading || !tagInput.trim()}
              className="rounded-lg bg-yarn-terracotta px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40 hover:bg-yarn-terracotta-hover transition-colors"
            >
              {t("editor.tagAdd")}
            </button>
          </div>
          {tagError ? <p className="mt-1 text-xs text-red-600" role="alert">{tagError}</p> : null}
        </div>
        </CollapsiblePanel>

        {/* Version history */}
        <CollapsiblePanel title={t("editor.panelHistory")} defaultOpen={false}>
          <VersionHistory patternId={patternId} />
        </CollapsiblePanel>

        {/* ── Rapports ── */}
        <CollapsiblePanel
          title={t("editor.rapports")}
          defaultOpen={false}
          forceOpen={isSelectionMode || hasSelection || Boolean(rapportInsertId)}
        >
        <div className="space-y-2">
          <div className="flex items-center justify-end">
            <button type="button" onClick={toggleSelectionMode}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                isSelectionMode
                  ? "bg-blue-100 border-blue-300 text-blue-700"
                  : "bg-yarn-oatmeal/60 border-transparent text-yarn-charcoal hover:bg-yarn-oatmeal"
              }`}>
              {isSelectionMode ? t("editor.rapportCancelSelect") : t("editor.rapportSelectBtn")}
            </button>
          </div>

          {/* Save form (shown after selection is drawn) */}
          {hasSelection && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-2 space-y-2">
              <p className="text-[10px] text-blue-600 font-medium">
                {t("editor.rapportSelected", {
                  w: Math.abs(selectionEnd![1] - selectionStart![1]) + 1,
                  h: Math.abs(selectionEnd![0] - selectionStart![0]) + 1
                })}
              </p>
              <div className="flex gap-1">
                <input value={rapportNameInput} onChange={(e) => setRapportNameInput(e.target.value)}
                  placeholder={t("editor.rapportNamePlaceholder")}
                  className="flex-1 rounded border border-blue-200 bg-white px-2 py-1 text-xs text-yarn-charcoal focus:outline-none focus:border-blue-400"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && rapportNameInput.trim()) {
                      saveSelectionAsRapport(rapportNameInput.trim());
                      setRapportNameInput("");
                    }
                  }}
                />
                <button type="button" disabled={!rapportNameInput.trim()}
                  onClick={() => { saveSelectionAsRapport(rapportNameInput.trim()); setRapportNameInput(""); }}
                  className="px-2 py-1 rounded bg-blue-500 text-white text-xs font-medium disabled:opacity-40 hover:bg-blue-600 transition-colors">
                  {t("editor.rapportSave")}
                </button>
              </div>
            </div>
          )}

          {/* Insert mode panel */}
          {rapportInsertId && activeRapport && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-amber-800">{activeRapport.name}</span>
                  <span className="text-[10px] text-amber-600 ml-1.5">{activeRapport.width}×{activeRapport.height}</span>
                </div>
                <button type="button" onClick={cancelRapportInsert}
                  title={t("editor.rapportCancelInsert")}
                  aria-label={t("editor.rapportCancelInsert")}
                  className="relative text-[10px] text-amber-600 hover:text-amber-800 transition-colors before:absolute before:-inset-2.5 before:content-['']">✕</button>
              </div>
              <div className="flex gap-1">
                {([
                  ["none", t("editor.mirrorNone")],
                  ["h", t("editor.mirrorH")],
                  ["v", t("editor.mirrorV")],
                  ["hv", t("editor.mirrorHV")]
                ] as const).map(([mode, label]) => (
                  <button key={mode} type="button" onClick={() => setRapportMirror(mode)}
                    className={`flex-1 rounded px-1 py-1 text-[10px] font-medium transition-colors ${
                      rapportMirror === mode
                        ? "bg-amber-500 text-white"
                        : "bg-white border border-amber-200 text-amber-700 hover:bg-amber-100"
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-amber-700">
                {t("editor.rapportInsertHint")}
              </p>
            </div>
          )}

          {/* Rapport list */}
          {rapports.length > 0 && (
            <div className="space-y-1">
              {rapports.map((rapport) => (
                <div key={rapport.id}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${
                    rapportInsertId === rapport.id ? "border-amber-400 bg-amber-50" : "border-yarn-sand/60 bg-white"
                  }`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-yarn-charcoal truncate">{rapport.name}</div>
                    <div className="text-[10px] text-yarn-warm-gray">{rapport.width}×{rapport.height}</div>
                  </div>
                  <button type="button"
                    onClick={() => rapportInsertId === rapport.id ? cancelRapportInsert() : startRapportInsert(rapport.id)}
                    className={`text-xs px-2 py-0.5 rounded transition-colors shrink-0 ${
                      rapportInsertId === rapport.id
                        ? "bg-amber-200 text-amber-800 hover:bg-amber-300"
                        : "bg-yarn-sage-light text-yarn-sage hover:bg-yarn-sage/20"
                    }`}>
                    {rapportInsertId === rapport.id ? t("editor.rapportCancelInsert") : t("editor.rapportInsert")}
                  </button>
                  <button type="button" onClick={() => deleteRapport(rapport.id)}
                    title={t("editor.rapportDelete")}
                    aria-label={t("editor.rapportDelete")}
                    className="relative text-yarn-warm-gray/40 hover:text-red-400 transition-colors text-sm leading-none shrink-0 before:absolute before:-inset-2 before:content-['']">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {rapports.length === 0 && !isSelectionMode && (
            <p className="text-[11px] text-yarn-warm-gray/70">
              {t("editor.rapportEmptyHint")}
            </p>
          )}
        </div>
        </CollapsiblePanel>

      </aside>

      {/* Grid column: on mobile it comes first, the sidebar follows. The toolbar sits
          outside the scrolling section so it can stick to the viewport. */}
      <div className="order-first min-w-0 space-y-3 lg:order-none">
      <EditorToolbar
        symbols={availableSymbols}
        selectedSymbolId={selectedSymbolId}
        onSelectSymbol={setSelectedSymbolId}
        palette={pattern.palette}
        selectedColor={selectedColor}
        onSelectColor={setSelectedColor}
        onUndo={undo}
        onRedo={redo}
        isFillMode={isFillMode}
        onToggleFill={toggleFillMode}
        saveState={saveState}
        saveLabel={saveLabel}
        zoomLevel={zoomLevel}
        onZoomIn={() => setZoom(zoomLevel + 0.2)}
        onZoomOut={() => setZoom(zoomLevel - 0.2)}
        onZoomReset={() => setZoom(1)}
        onZoomFit={fitZoomToWidth}
      />
      {isFillMode && (
        <p className="px-1 text-[11px] text-yarn-warm-gray/80">{t("editor.fillHint")}</p>
      )}
      <section ref={gridSectionRef} className="overflow-auto rounded-2xl bg-white/70 border border-yarn-sand/50 p-3 sm:p-4 lg:p-5 shadow-warm-sm">
        <p className="mb-2 hidden text-right text-[10px] text-yarn-warm-gray/70 lg:block">{t("editor.zoomScrollHint")}</p>

        {/* Add/remove row top */}
        <div className="flex justify-center gap-1 mb-1">
          <button type="button" onClick={() => addEdge("top")} title={t("editor.addRowTop")} aria-label={t("editor.addRowTop")}
            className="relative flex items-center gap-1 rounded-full border border-dashed border-yarn-sand/70 bg-yarn-oatmeal/40 px-4 py-0.5 text-xs font-bold text-yarn-warm-gray hover:border-yarn-terracotta/50 hover:bg-yarn-terracotta-light/40 hover:text-yarn-terracotta transition-colors before:absolute before:-inset-y-1.5 before:inset-x-0 before:content-['']">
            +
          </button>
          <button type="button" onClick={() => removeEdge("top")} title={t("editor.removeRowTop")} aria-label={t("editor.removeRowTop")}
            className="relative flex items-center gap-1 rounded-full border border-dashed border-yarn-sand/70 bg-yarn-oatmeal/40 px-4 py-0.5 text-xs font-bold text-yarn-warm-gray hover:border-red-400/50 hover:bg-red-50 hover:text-red-500 transition-colors before:absolute before:-inset-y-1.5 before:inset-x-0 before:content-['']">
            −
          </button>
        </div>

        <div className="flex gap-1 items-stretch">
          {/* Add/remove col left */}
          <div className="flex flex-col gap-1 shrink-0">
            <button type="button" onClick={() => addEdge("left")} title={t("editor.addColLeft")} aria-label={t("editor.addColLeft")}
              className="relative flex flex-1 items-center justify-center rounded-full border border-dashed border-yarn-sand/70 bg-yarn-oatmeal/40 w-6 text-xs font-bold text-yarn-warm-gray hover:border-yarn-terracotta/50 hover:bg-yarn-terracotta-light/40 hover:text-yarn-terracotta transition-colors before:absolute before:-inset-x-1.5 before:inset-y-0 before:content-['']">
              +
            </button>
            <button type="button" onClick={() => removeEdge("left")} title={t("editor.removeColLeft")} aria-label={t("editor.removeColLeft")}
              className="relative flex flex-1 items-center justify-center rounded-full border border-dashed border-yarn-sand/70 bg-yarn-oatmeal/40 w-6 text-xs font-bold text-yarn-warm-gray hover:border-red-400/50 hover:bg-red-50 hover:text-red-500 transition-colors before:absolute before:-inset-x-1.5 before:inset-y-0 before:content-['']">
              −
            </button>
          </div>

          <div
            className="grid flex-1"
            style={{
              gridTemplateColumns: zoomLevel === 1
                ? `repeat(${pattern.width}, minmax(40px, 1fr)) 40px`
                : `repeat(${pattern.width}, ${cellPx}px) ${cellPx}px`,
              gridTemplateRows: zoomLevel === 1
                ? `repeat(${visibleRowIndexes.length}, minmax(40px, auto)) 40px`
                : `repeat(${visibleRowIndexes.length}, ${cellPx}px) ${cellPx}px`
            }}
            onPointerUp={() => { if (isSelectionMode && isSelecting) endSelection(); }}
          >
            {visibleRowIndexes.flatMap((rowIndex, displayIdx) => [
              ...pattern.cells[rowIndex].map((cell, columnIndex) => {
                // In skip mode vertical spans collapse; a symbol anchored in a hidden
                // row is projected onto its first visible row so it doesn't vanish
                let displaySymbolId = cell.symbolId;
                if (cell.occupiedByAnchor) {
                  if (!skipPurl) return null;
                  const [ar, ac] = cell.occupiedByAnchor;
                  if (ar === rowIndex) return null;
                  const anchorHidden = (pattern.height - ar) % 2 === 0;
                  if (anchorHidden && rowIndex === ar + 1) {
                    const anchorCell = pattern.cells[ar]?.[ac];
                    const anchorWidth = anchorCell
                      ? availableSymbols.find((s) => s.id === anchorCell.symbolId)?.width ?? 1
                      : 1;
                    if (columnIndex === ac && anchorCell) {
                      displaySymbolId = anchorCell.symbolId;
                    } else if (columnIndex < ac + anchorWidth) {
                      return null; // covered by the projected anchor's colspan
                    }
                  }
                }
                const symbol = availableSymbols.find((item) => item.id === displaySymbolId);
                const sw = symbol?.width ?? 1;
                const sh = skipPurl ? 1 : symbol?.height ?? 1;
                const selected = inSelectionRect(rowIndex, columnIndex, selectionStart, selectionEnd);

                return (
                  <button
                    key={`${rowIndex}-${columnIndex}`}
                    type="button"
                    data-row={rowIndex}
                    data-col={columnIndex}
                    onClick={() => {
                      if (isSelectionMode) return;
                      if (rapportInsertId) { insertRapport(rowIndex, columnIndex); return; }
                      if (isFillMode) { fillCells(rowIndex, columnIndex); return; }
                      paintCell(rowIndex, columnIndex);
                    }}
                    onPointerDown={(e) => {
                      if (!isSelectionMode) return;
                      e.preventDefault();
                      startSelection(rowIndex, columnIndex);
                    }}
                    onPointerEnter={() => {
                      if (!isSelectionMode || !isSelecting) return;
                      updateSelection(rowIndex, columnIndex);
                    }}
                    className={[
                      "flex items-center justify-center text-xs font-semibold text-yarn-charcoal transition-shadow relative",
                      // Grid lines via top/left borders (crisp 1px), not gap-bleed —
                      // avoids subpixel "white stripes" on fractional 1fr tracks.
                      columnIndex > 0 ? "border-l border-yarn-sand/60" : "",
                      displayIdx > 0 ? "border-t border-yarn-sand/60" : "",
                      isSelectionMode ? "cursor-crosshair" : rapportInsertId ? "cursor-crosshair hover:ring-2 hover:ring-amber-400/70" : isFillMode ? "cursor-cell hover:ring-2 hover:ring-yarn-terracotta/60" : "hover:ring-1 hover:ring-yarn-terracotta/40",
                      selected ? "ring-2 ring-inset ring-blue-500" : ""
                    ].join(" ")}
                    style={{
                      backgroundColor: cell.color,
                      gridRow: sh > 1 ? `${displayIdx + 1} / span ${sh}` : displayIdx + 1,
                      gridColumn: sw > 1 ? `${columnIndex + 1} / span ${sw}` : columnIndex + 1,
                      aspectRatio: sw === 1 && sh === 1 ? "1" : undefined,
                      minHeight: `${cellPx}px`
                    }}
                    title={`${t("editor.cellTitle", { row: String(pattern.height - rowIndex), col: String(pattern.width - columnIndex) })}${sw > 1 || sh > 1 ? ` (${sw}×${sh})` : ""}`}
                  >
                    {selected && (
                      <div className="absolute inset-0 bg-blue-400/20 pointer-events-none" />
                    )}
                    {symbol?.imageData ? (
                      <Image src={symbol.imageData} alt={symbol.label} width={40 * sw} height={40 * sh} className="object-contain w-full h-full relative z-10" />
                    ) : (
                      <span className="relative z-10">{symbol?.glyph ?? "·"}</span>
                    )}
                  </button>
                );
              }).filter(Boolean),
              <div key={`row-${rowIndex}`}
                className={`flex items-center justify-center bg-yarn-oatmeal text-[10px] font-mono font-semibold text-yarn-warm-gray border-l border-yarn-sand/60${displayIdx > 0 ? " border-t border-yarn-sand/60" : ""}`}
                style={{ gridRow: displayIdx + 1, gridColumn: pattern.width + 1, minHeight: `${cellPx}px` }}>
                {pattern.height - rowIndex}
              </div>
            ])}
            {Array.from({ length: pattern.width }, (_, columnIndex) => (
              <div key={`column-${columnIndex}`}
                className={`flex items-center justify-center bg-yarn-oatmeal text-[10px] font-mono font-semibold text-yarn-warm-gray border-t border-yarn-sand/60${columnIndex > 0 ? " border-l border-yarn-sand/60" : ""}`}
                style={{ gridRow: visibleRowIndexes.length + 1, gridColumn: columnIndex + 1, minHeight: `${cellPx}px` }}>
                {pattern.width - columnIndex}
              </div>
            ))}
            <div className="bg-yarn-oatmeal rounded-br border-l border-t border-yarn-sand/60" style={{ gridRow: visibleRowIndexes.length + 1, gridColumn: pattern.width + 1 }} />
          </div>

          {/* Add/remove col right */}
          <div className="flex flex-col gap-1 shrink-0">
            <button type="button" onClick={() => addEdge("right")} title={t("editor.addColRight")} aria-label={t("editor.addColRight")}
              className="relative flex flex-1 items-center justify-center rounded-full border border-dashed border-yarn-sand/70 bg-yarn-oatmeal/40 w-6 text-xs font-bold text-yarn-warm-gray hover:border-yarn-terracotta/50 hover:bg-yarn-terracotta-light/40 hover:text-yarn-terracotta transition-colors before:absolute before:-inset-x-1.5 before:inset-y-0 before:content-['']">
              +
            </button>
            <button type="button" onClick={() => removeEdge("right")} title={t("editor.removeColRight")} aria-label={t("editor.removeColRight")}
              className="relative flex flex-1 items-center justify-center rounded-full border border-dashed border-yarn-sand/70 bg-yarn-oatmeal/40 w-6 text-xs font-bold text-yarn-warm-gray hover:border-red-400/50 hover:bg-red-50 hover:text-red-500 transition-colors before:absolute before:-inset-x-1.5 before:inset-y-0 before:content-['']">
              −
            </button>
          </div>
        </div>

        {/* Add/remove row bottom */}
        <div className="flex justify-center gap-1 mt-1">
          <button type="button" onClick={() => addEdge("bottom")} title={t("editor.addRowBottom")} aria-label={t("editor.addRowBottom")}
            className="relative flex items-center gap-1 rounded-full border border-dashed border-yarn-sand/70 bg-yarn-oatmeal/40 px-4 py-0.5 text-xs font-bold text-yarn-warm-gray hover:border-yarn-terracotta/50 hover:bg-yarn-terracotta-light/40 hover:text-yarn-terracotta transition-colors before:absolute before:-inset-y-1.5 before:inset-x-0 before:content-['']">
            +
          </button>
          <button type="button" onClick={() => removeEdge("bottom")} title={t("editor.removeRowBottom")} aria-label={t("editor.removeRowBottom")}
            className="relative flex items-center gap-1 rounded-full border border-dashed border-yarn-sand/70 bg-yarn-oatmeal/40 px-4 py-0.5 text-xs font-bold text-yarn-warm-gray hover:border-red-400/50 hover:bg-red-50 hover:text-red-500 transition-colors before:absolute before:-inset-y-1.5 before:inset-x-0 before:content-['']">
            −
          </button>
        </div>
      </section>
      </div>

      {/* Toast */}
      {toastData && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-yarn-charcoal text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-medium animate-fade-in flex items-center gap-3">
          <span>{t(toastData.key as TranslationKey, toastData.params)}</span>
          <button onClick={clearToast} className="text-white/70 hover:text-white text-lg leading-none">&times;</button>
        </div>
      )}
    </div>
  );
}
