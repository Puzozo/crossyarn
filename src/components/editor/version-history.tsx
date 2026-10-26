"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/context";

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
  const { t } = useTranslation();
  const [versions, setVersions] = useState<VersionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<object | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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
    setLoading(true);
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

  const handleRestore = async (versionId: string) => {
    if (!confirm(t("versions.restoreConfirm"))) return;
    setRestoring(true);
    try {
      const res = await fetch(`/api/patterns/${patternId}/versions/${versionId}/restore`, {
        method: "POST",
      });
      if (!res.ok) return;
      setToast(t("versions.restored"));
      // Refresh list
      const listRes = await fetch(`/api/patterns/${patternId}/versions`);
      if (listRes.ok) {
        const data = await listRes.json();
        setVersions(data);
      }
    } catch {
      // ignore
    } finally {
      setRestoring(false);
    }
  };

  if (loading && versions.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-yarn-warm-gray">{t("versions.title")}</p>
        <p className="text-xs text-yarn-warm-gray">{t("versions.loading")}</p>
      </div>
    );
  }

  if (versions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-yarn-warm-gray">{t("versions.title")}</p>
      <div className="space-y-1" role="list" aria-label={t("versions.listLabel")}>
        {versions.map((v, idx) => {
          const n = versions.length - idx;
          const isExpanded = expandedId === v.id;
          const date = new Date(v.createdAt);
          const dateStr = date.toLocaleDateString(undefined, {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
          });
          const timeStr = date.toLocaleTimeString(undefined, {
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
                <button
                  type="button"
                  onClick={() => handleRestore(v.id)}
                  disabled={restoring}
                  className="text-[10px] py-1 px-2 rounded-lg bg-yarn-terracotta-light text-yarn-terracotta hover:bg-yarn-terracotta-hover hover:text-white transition-colors disabled:opacity-50"
                  title={t("versions.restore")}
                >
                  ↺
                </button>
              </div>
              {isExpanded && snapshot && (
                <div className="text-[10px] text-yarn-warm-gray bg-yarn-oatmeal/60 rounded-lg p-2 max-h-32 overflow-auto">
                  <pre className="whitespace-pre-wrap font-mono leading-relaxed">
                    {JSON.stringify(snapshot, null, 2).slice(0, 2000)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {toast && (
        <p className="text-xs text-yarn-sage font-medium animate-fade-in">{toast}</p>
      )}
    </div>
  );
}
