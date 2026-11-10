"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Language, translate } from "@/lib/i18n/translations";

// Client component: the signed Bunny URL is fetched via POST /api/video/embed
// and the session is kept alive via POST /api/video/heartbeat, so the signed
// URL never appears in SSR HTML.
type ProtectedVideoEmbedProps = {
  videoId: string;
  title?: string;
  lang: Language;
  signedIn: boolean;
  canView: boolean;
  masterClassId: string | null;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; reason: "tooManyDevices" | "unavailable" }
  | { status: "ready"; url: string };

const HEARTBEAT_INTERVAL_MS = 30000;

function Placeholder({ message, cta }: { message: string; cta?: React.ReactNode }) {
  return (
    <div
      className="my-6 flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-yarn-sand bg-yarn-cream/40 p-6 text-center"
    >
      <p className="text-yarn-warm-gray">{message}</p>
      {cta}
    </div>
  );
}

export function ProtectedVideoEmbed({
  videoId,
  title,
  lang,
  signedIn,
  canView,
  masterClassId,
}: ProtectedVideoEmbedProps) {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    if (!signedIn || !canView || !masterClassId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;
    const clearTimer = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };

    const sendHeartbeat = async () => {
      let res: Response;
      try {
        res = await fetch("/api/video/heartbeat", { method: "POST" });
      } catch {
        if (!cancelled) {
          clearTimer();
          setLoad({ status: "error", reason: "unavailable" });
        }
        return;
      }
      if (cancelled) return;
      if (!res.ok) {
        clearTimer();
        setLoad({ status: "error", reason: res.status === 409 ? "tooManyDevices" : "unavailable" });
      }
    };

    // The signed URL is fetched exactly once, on mount; it is never refreshed
    // or swapped by the heartbeat — the heartbeat only keeps the server-side
    // session alive (and hides the player if the session is lost).
    const fetchEmbed = async () => {
      let res: Response;
      try {
        res = await fetch("/api/video/embed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ masterClassId, videoId }),
        });
      } catch {
        if (!cancelled) setLoad({ status: "error", reason: "unavailable" });
        return;
      }
      if (cancelled) return;
      if (res.status === 409) {
        setLoad({ status: "error", reason: "tooManyDevices" });
      } else if (!res.ok) {
        setLoad({ status: "error", reason: "unavailable" });
      } else {
        let url: string | undefined;
        try {
          const data = (await res.json()) as { url?: string };
          url = data.url;
        } catch {
          url = undefined;
        }
        if (!url) {
          setLoad({ status: "error", reason: "unavailable" });
          return;
        }
        setLoad({ status: "ready", url });
        timer = setInterval(() => {
          void sendHeartbeat();
        }, HEARTBEAT_INTERVAL_MS);
      }
    };

    void fetchEmbed();

    return () => {
      cancelled = true;
      clearTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [masterClassId, videoId]);

  if (!signedIn) {
    return (
      <Placeholder
        message={translate(lang, "masterClass.protectedVideo.signIn")}
        cta={
          <Link href="/sign-in" className="text-sm font-medium text-yarn-terracotta underline">
            {translate(lang, "masterClass.protectedVideo.signInCta")}
          </Link>
        }
      />
    );
  }

  if (!canView) {
    return <Placeholder message={translate(lang, "masterClass.protectedVideo.locked")} />;
  }

  if (!masterClassId) {
    return <Placeholder message={translate(lang, "masterClass.protectedVideo.unavailable")} />;
  }

  if (load.status === "loading") {
    return (
      <div className="my-6">
        <div className="aspect-video w-full overflow-hidden rounded-lg border border-yarn-sand/50 bg-black/5" />
      </div>
    );
  }

  if (load.status === "error") {
    const message =
      load.reason === "tooManyDevices"
        ? translate(lang, "masterClass.protectedVideo.tooManyDevices")
        : translate(lang, "masterClass.protectedVideo.unavailable");
    return <Placeholder message={message} />;
  }

  return (
    <figure className="my-6">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-yarn-sand/50 bg-black">
        <iframe
          src={load.url}
          title={title ?? translate(lang, "masterClass.protectedVideo.title")}
          loading="lazy"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    </figure>
  );
}
