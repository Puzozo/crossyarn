"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";

type Props = {
  patternId: string;
  initialCount: number;
  initialLiked: boolean;
  isAuthenticated: boolean;
  /** "card" — compact chip on catalog cards; "page" — full button on /p/[id] */
  variant?: "card" | "page";
};

export function LikeButton({
  patternId,
  initialCount,
  initialLiked,
  isAuthenticated,
  variant = "page"
}: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }
    if (pending) return;

    // Optimistic flip; server response is authoritative, errors roll back.
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)));
    setPending(true);
    try {
      const res = await fetch(`/api/patterns/${patternId}/like`, {
        method: nextLiked ? "POST" : "DELETE"
      });
      if (!res.ok) throw new Error("like failed");
      const data = (await res.json()) as { liked: boolean; count: number };
      setLiked(data.liked);
      setCount(data.count);
    } catch {
      setLiked(!nextLiked);
      setCount((c) => Math.max(0, c + (nextLiked ? -1 : 1)));
    } finally {
      setPending(false);
    }
  };

  const heart = (
    <svg
      width={variant === "card" ? 14 : 16}
      height={variant === "card" ? 14 : 16}
      viewBox="0 0 24 24"
      fill={liked ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={liked ? t("like.unlike") : t("like.like")}
        aria-pressed={liked}
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors ${
          liked
            ? "text-yarn-terracotta"
            : "text-yarn-warm-gray hover:text-yarn-terracotta"
        }`}
      >
        {heart}
        {count > 0 ? <span>{count}</span> : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={liked ? t("like.unlike") : t("like.like")}
      aria-pressed={liked}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
        liked
          ? "border-yarn-terracotta/40 bg-yarn-terracotta-light text-yarn-terracotta"
          : "border-yarn-sand bg-white/70 text-yarn-charcoal hover:border-yarn-terracotta/40 hover:text-yarn-terracotta"
      }`}
    >
      {heart}
      <span>{liked ? t("like.liked") : t("like.like")}</span>
      <span className={liked ? "text-yarn-terracotta/70" : "text-yarn-warm-gray"}>{count}</span>
    </button>
  );
}
