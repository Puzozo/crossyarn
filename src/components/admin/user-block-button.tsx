"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UserBlockButton({
  userId,
  isDisabled
}: {
  userId: string;
  isDisabled: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    const action = isDisabled ? "unblock" : "block";
    const label = isDisabled ? "розблокувати" : "заблокувати";
    if (!confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} цього користувача?`)) return;

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
    <button
      type="button"
      onClick={() => void handleToggle()}
      disabled={loading}
      className={`text-xs font-medium transition-colors disabled:opacity-50 ${
        isDisabled
          ? "text-emerald-400 hover:text-emerald-300"
          : "text-red-400 hover:text-red-300"
      }`}
    >
      {loading ? "..." : isDisabled ? "Розблокувати" : "Заблокувати"}
    </button>
  );
}
