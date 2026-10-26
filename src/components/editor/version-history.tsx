"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PatternGrid } from "@/components/patterns/pattern-grid";
import type { PatternDocument } from "@/lib/patterns/model";

interface VersionItem {
  id: string;
  createdAt: Date;
}

/**
 * Version history sidebar section.
 * Fetches the last 10 versions for the pattern, lets the user
 * preview a snapshot and restore it (creates a new version entry).
 */
export function VersionHistory({ patternId }: { patternId: string }) {
  const { t, lang } = useTranslation();
  const locale = lang === "uk" ? "uk-UA" : "en-GB";
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<PatternDocument | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const fetchVersions = useCallback(async () => {
    try {
      const res = await fetch(`/api/patterns/${patternId}/versions`);
      if (!res.ok) return;
      const data = await res.json();
      setVersions(data);
    } catch {
      // silently fail — editor works without history
    } finally {
      setLoading(false);
    }
  }, [patternId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const loadSnapshot = async (versionId: string) => {
    if (expandedId === versionId && snapshot) return;
    try {
      const res = await fetch(`/api/patterns/${patternId}/versions/${versionId}`);
      if (!res.ok) return;
      const data = await res.json();
      setSnapshot(data.snapshot);
      setExpandedId(versionId);
    } catch {
      // ignore
    }
  };

  const restoreVersion = async (versionId: string, n: number) => {
    setRestoring(true);
    try {
      const res = await fetch(`/api/patterns/${patternId}/versions/${versionId}/restore`, {
        method: "POST",
      });
      if (!res.ok) return;
      // The editor re-reads this toast after the reload; keep it in sessionStorage
      // so the message survives window.location.reload().
      try {
        sessionStorage.setItem(
          "crossyarn:toast",
          JSON.stringify({ key: "versions.restoredToast", params: { n } })
        );
      } catch {
        // storage unavailable
      }
      // The server rewrote the pattern; reload so the editor state (and autosave)
      // starts from the restored document instead of overwriting it.
      window.location.reload();
    } catch {
      // ignore
    } finally {
      setRestoring(false);
    }
  };

  if (loading && versions.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-yarn-warm-gray">{t("versions.loading")}</p>
      </div>
    );
  }

  if (versions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1" role="list" aria-label={t("versions.listLabel")}>
        {versions.map((v, idx) => {
          const n = versions.length - idx;
          const isExpanded = expandedId === v.id;
          const date = new Date(v.createdAt);
          const dateStr = date.toLocaleDateString(locale, {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          });
          const timeStr = date.toLocaleTimeString(locale, {
            hour: "2-digit",
            minute: "2-digit",
          });
          return (
            <div key={v.id} className="space-y-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => loadSnapshot(v.id)}
                  className={`flex-1 text-left text-xs py-1 px-2 rounded-lg transition-colors ${
                    isExpanded
                      ? "bg-yarn-sage-light text-yarn-sage font-medium"
                      : "text-yarn-charcoal hover:bg-yarn-oatmeal"
                  }`}
                >
                  #{n} — {dateStr} {timeStr}
                </button>
                {idx === 0 ? (
                  <span className="rounded-full bg-yarn-sage-light px-2 py-0.5 text-[10px] font-medium text-yarn-sage">
                    {t("versions.current")}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRestoreTarget(v.id)}
                    disabled={restoring}
                    className="text-[10px] py-1 px-2 rounded-lg bg-yarn-terracotta-light text-yarn-terracotta hover:bg-yarn-terracotta-hover hover:text-white transition-colors disabled:opacity-50 min-h-8 min-w-8"
                    title={t("versions.restore")}
                    aria-label={t("versions.restoreN", { n })}
                  >
                    ↺
                  </button>
                )}
              </div>
              {isExpanded && snapshot && Array.isArray(snapshot.cells) && (
                <div className="text-[10px] text-yarn-warm-gray">
                  <div className="max-h-48 overflow-auto rounded-lg bg-yarn-oatmeal/60 p-2">
                    <div style={{ zoom: 0.4 }}>
                      <PatternGrid document={snapshot} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {restoreTarget && (
        <ConfirmDialog
          open
          title={t("versions.restoreTitle")}
          message={t("versions.restoreConfirm")}
          confirmLabel={t("versions.restore")}
          cancelLabel={t("common.cancel")}
          busy={restoring}
          onConfirm={() => {
            const n = versions.length - versions.findIndex((v) => v.id === restoreTarget);
            setRestoreTarget(null);
            void restoreVersion(restoreTarget, n);
          }}
          onCancel={() => setRestoreTarget(null)}
        />
      )}
    </div>
  );
}
