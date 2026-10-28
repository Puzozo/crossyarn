"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n/context";
import { apiErrorMessage } from "@/lib/i18n/api-errors";

export function ForgotPasswordContent() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(apiErrorMessage(t, data, "auth.genericError"));
        return;
      }
      setSent(true);
    } catch {
      setError(t("auth.genericError"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          {/* Back link */}
          <Link href="/sign-in" className="inline-flex items-center gap-1 text-sm text-yarn-warm-gray hover:text-yarn-charcoal transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 12L6 8l4-4" />
            </svg>
            {t("auth.forgotPasswordBack")}
          </Link>

          <div className="flex justify-center">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-yarn-terracotta opacity-60">
              <rect x="8" y="16" width="32" height="22" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 19l16 10 16-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div>
            <h1 className="font-display text-2xl font-bold text-yarn-charcoal">
              {t("auth.forgotPasswordTitle")}
            </h1>
            {!sent ? (
              <p className="mt-2 text-sm text-yarn-warm-gray">
                {t("auth.forgotPasswordDesc")}
              </p>
            ) : null}
          </div>
        </div>

        {sent ? (
          <div className="rounded-2xl bg-white/80 backdrop-blur border border-yarn-sand/50 p-8 shadow-warm text-center space-y-4">
            <div className="flex justify-center">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-green-600">
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" />
                <path d="M16 24l6 6 10-12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm text-yarn-charcoal font-medium">
              {t("auth.forgotPasswordSent")}
            </p>
            <p className="text-xs text-yarn-warm-gray">
              {t("auth.forgotPasswordNote")}
            </p>
            <p className="mt-2 text-xs text-yarn-warm-gray">
              {t("auth.forgotPasswordSpamHint")}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl bg-white/80 backdrop-blur border border-yarn-sand/50 p-8 shadow-warm space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-yarn-charcoal">
                {t("auth.email")}
              </label>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                required
                autoFocus
              />
            </div>

            {error && (
              <div role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? t("auth.pending") : t("auth.forgotPasswordSubmit")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
