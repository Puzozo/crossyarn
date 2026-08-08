"use client";

import { ChangeEvent, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";

const ERROR_KEYS: Record<string, string> = {
  FILE_TOO_LARGE: "import.fileTooLarge",
  INVALID_FORMAT: "import.invalidFormat",
  INVALID_FILE: "import.invalidFormat",
  RATE_LIMITED: "import.rateLimited",
  PREMIUM_REQUIRED: "import.premiumRequired"
};

export function ImportPatternCard({ isPremium }: { isPremium: boolean }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPending(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    let response: Response;
    try {
      response = await fetch("/api/imports", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: formData
      });
    } catch {
      setError(t("import.error"));
      setPending(false);
      return;
    }

    const data = await response.json().catch(() => null);

    // An existing in-progress / created job — go straight to its preview.
    if (response.status === 409 && data?.id) {
      router.push(`/imports/${data.id}/preview`);
      return;
    }
    if (response.status === 403) {
      setPending(false);
      setGateOpen(true);
      return;
    }
    if (!response.ok || !data?.id) {
      const key = data?.error && ERROR_KEYS[data.error];
      setError(key ? t(key as never) : t("import.error"));
      setPending(false);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    router.push(`/imports/${data.id}/preview`);
  }

  if (!isPremium) {
    return (
      <>
        <Button type="button" variant="secondary" onClick={() => setGateOpen(true)}>
          <LockIcon />
          {t("patterns.importBtn")}
        </Button>
        {gateOpen && <PremiumGate onClose={() => setGateOpen(false)} />}
      </>
    );
  }

  return (
    <>
      <label className="inline-flex cursor-pointer items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleImport}
          disabled={pending}
        />
        <Button type="button" variant="secondary" disabled={pending}>
          {pending ? t("import.uploading") : t("patterns.importBtn")}
        </Button>
      </label>
      {error ? <span className="ml-2 text-sm text-red-600">{error}</span> : null}
      {gateOpen && <PremiumGate onClose={() => setGateOpen(false)} />}
    </>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="mr-1.5" aria-hidden>
      <rect x="2.5" y="6" width="9" height="6" rx="1.5" />
      <path d="M4.5 6V4.5a2.5 2.5 0 0 1 5 0V6" strokeLinecap="round" />
    </svg>
  );
}

function PremiumGate({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-yarn-charcoal/40 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-warm space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-yarn-terracotta-light text-yarn-terracotta">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="4" y="10" width="16" height="11" rx="2.5" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
            </svg>
          </span>
        </div>
        <div className="text-center space-y-1.5">
          <h2 className="font-display text-xl font-bold text-yarn-charcoal">{t("import.premiumRequired")}</h2>
          <p className="text-sm text-yarn-warm-gray">{t("import.premiumSubtitle")}</p>
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <Link
            href="/premium"
            className="w-full rounded-xl bg-yarn-terracotta py-2.5 text-center text-sm font-semibold text-white hover:bg-yarn-terracotta-hover transition-colors"
          >
            {t("import.getPremium")}
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl py-2 text-center text-sm font-medium text-yarn-warm-gray hover:text-yarn-charcoal transition-colors"
          >
            {t("import.maybeLater")}
          </button>
        </div>
      </div>
    </div>
  );
}
