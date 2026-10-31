"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";

export type ContentListItem = {
  id: string;
  title: string;
  slug: string;
  lang: string; // "uk" | "en"
  status: "DRAFT" | "PUBLISHED" | "PENDING_REVIEW" | "REJECTED";
  updatedAt: string; // ISO
  publishedAt: string | null; // ISO
};

type AdminContentListProps = {
  kind: "masterClass" | "post";
  items: ContentListItem[];
};

const STATUS_LABELS: Record<ContentListItem["status"], string> = {
  DRAFT: "Чернетка",
  PUBLISHED: "Опубліковано",
  PENDING_REVIEW: "На розгляді",
  REJECTED: "Відхилено",
};

const STATUS_BADGES: Record<ContentListItem["status"], string> = {
  DRAFT: "bg-gray-800 text-gray-400",
  PUBLISHED: "bg-emerald-900/40 text-emerald-300",
  PENDING_REVIEW: "bg-amber-900/40 text-amber-300",
  REJECTED: "bg-red-900/40 text-red-300",
};

function StatusBadge({ status }: { status: ContentListItem["status"] }) {
  return (
    <span
      className={("inline-block rounded-full px-2.5 py-1 text-xs font-medium " + STATUS_BADGES[status])}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function ItemActions({
  item,
  apiBase,
  editPath,
  onDeleteRequest,
  busy,
}: {
  item: ContentListItem;
  apiBase: string;
  editPath: string;
  onDeleteRequest: (item: ContentListItem) => void;
  busy: boolean;
}) {
  const router = useRouter();
  const [actionBusy, setActionBusy] = useState(false);

  const handleTogglePublish = async () => {
    setActionBusy(true);
    try {
      const response = await fetch(apiBase + "/" + item.id + "/publish", {
        method: item.status === "PUBLISHED" ? "DELETE" : "POST",
      });
      if (!response.ok) {
        let fields: string[] = [];
        try {
          const data = await response.json();
          if (Array.isArray(data?.fields)) fields = data.fields;
        } catch {
          // non-JSON response — nothing extra to show
        }
        alert("Не вистачає: " + fields.join(", "));
        return;
      }
      router.refresh();
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={editPath}
        className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
      >
        Редагувати
      </Link>
      <Link
        href={(editPath + "/preview")}
        className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors"
      >
        {"Прев'ю"}
      </Link>
      <button
        type="button"
        disabled={busy || actionBusy}
        onClick={handleTogglePublish}
        className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium transition-colors disabled:opacity-50"
      >
        {item.status === "PUBLISHED" ? "Зняти" : "Опублікувати"}
      </button>
      <button
        type="button"
        disabled={busy || actionBusy}
        onClick={() => onDeleteRequest(item)}
        className="px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-800/40 text-red-300 text-xs font-medium transition-colors disabled:opacity-50"
      >
        Видалити
      </button>
    </div>
  );
}

export function AdminContentList({ kind, items }: AdminContentListProps) {
  const apiBase = kind === "masterClass" ? "/api/admin/master-classes" : "/api/admin/posts";
  const editPath = (id: string) =>
    kind === "masterClass" ? "/admin/master-classes/" + id : "/admin/posts/" + id;

  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<ContentListItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await fetch(apiBase + "/" + deleteTarget.id, { method: "DELETE" } );
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setDeleteBusy(false);
    }
  };

  if (items.length === 0) {
    return <div className="text-center py-12 text-gray-500">Записів не знайдено</div>;
  }

  return (
    <>
      {/* Desktop: table */}
      <div className="hidden md:block rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/50">
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Назва</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Мова</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Статус</th>
              <th className="text-left px-4 py-3 text-gray-400 font-medium">Оновлено</th>
              <th className="text-right px-4 py-3 text-gray-400 font-medium">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-900/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="text-white font-medium">{item.title}</div>
                  <div className="text-gray-500 text-xs">{item.slug}</div>
                </td>
                <td className="px-4 py-3 text-gray-300 uppercase text-xs">{item.lang}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(item.updatedAt).toLocaleDateString("uk-UA")}
                </td>
                <td className="px-4 py-3 text-right">
                  <ItemActions
                    item={item}
                    apiBase={apiBase}
                    editPath={editPath(item.id)}
                    onDeleteRequest={setDeleteTarget}
                    busy={deleteBusy}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-gray-800 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-white font-medium">{item.title}</div>
                <div className="text-gray-500 text-xs">{item.slug}</div>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <div className="text-xs text-gray-400">
              {item.lang.toUpperCase()}
              {" "}
              · Оновлено:
              {" "}
              {new Date(item.updatedAt).toLocaleDateString("uk-UA")}
            </div>
            <ItemActions
              item={item}
              apiBase={apiBase}
              editPath={editPath(item.id)}
              onDeleteRequest={setDeleteTarget}
              busy={deleteBusy}
            />
          </div>
        ))}
      </div>

      <AdminConfirmDialog
        open={deleteTarget !== null}
        title="Видалити запис?"
        message={deleteTarget ? "«" + deleteTarget.title + "» буде видалено безповоротно." : undefined}
        confirmLabel="Видалити"
        cancelLabel="Скасувати"
        danger
        busy={deleteBusy}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
