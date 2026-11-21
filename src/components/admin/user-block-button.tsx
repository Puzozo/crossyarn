"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";

export function UserBlockButton({
  userId,
  isDisabled
}: {
  userId: string;
  isDisabled: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleToggle() {
    const action = isDisabled ? "unblock" : "block";

    setLoading(true);
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
          isDisabled
            ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30"
            : "text-red-400 hover:text-red-300 hover:bg-red-950/30"
        }`}
      >
        {loading ? "..." : isDisabled ? "Розблокувати" : "Заблокувати"}
      </button>
      <AdminConfirmDialog
        open={confirmOpen}
        title={isDisabled ? "Розблокувати користувача?" : "Заблокувати користувача?"}
        confirmLabel={isDisabled ? "Розблокувати" : "Заблокувати"}
        cancelLabel="Скасувати"
        danger={!isDisabled}
        busy={loading}
        onConfirm={() => {
          setConfirmOpen(false);
          void handleToggle();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
