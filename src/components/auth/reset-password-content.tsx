"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n/context";
import { apiErrorMessage } from "@/lib/i18n/api-errors";

export function ResetPasswordContent({ tokenValid }: { tokenValid: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  const token = searchParams.get("token");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("auth.passwordsNoMatch"));
      return;
    }

    if (password.length < 8) {
      setError(t("auth.passwordTooShort"));
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        if (res.status === 429) {
          setError(apiErrorMessage(t, await res.json().catch(() => null), "auth.genericError"));
        } else {
          // 400 = token used/expired meanwhile; the API message is English-only
          setError(res.status === 400 ? t("auth.invalidToken") : t("auth.genericError"));
        }
        return;
      }
      setSuccess(true);
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
              <path d="M24 8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 14h16l2 6H14l2-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <rect x="12" y="18" width="24" height="22" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M18 30l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div>
            <h1 className="font-display text-2xl font-bold text-yarn-charcoal">
              {!token || !tokenValid ? t("auth.linkInvalidTitle") : t("auth.resetPasswordTitle")}
            </h1>
            {!token || !tokenValid ? null : (
              <p className="mt-2 text-sm text-yarn-warm-gray">
                {t("auth.resetPasswordDesc")}
              </p>
            )}
          </div>
        </div>

        {success ? (
          <div className="rounded-2xl bg-white/80 backdrop-blur border border-yarn-sand/50 p-8 shadow-warm text-center space-y-4">
            <div className="flex justify-center">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-green-600">
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" />
                <path d="M16 24l6 6 10-12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm text-yarn-charcoal font-medium">
              {t("auth.resetPasswordSuccess")}
            </p>
            <Link
              href="/sign-in"
              className="inline-block rounded-xl bg-yarn-terracotta px-5 py-2.5 text-sm font-semibold text-white shadow-warm-sm transition-colors hover:bg-yarn-terracotta-hover"
            >
              {t("auth.backToSignIn")}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-2xl bg-white/80 backdrop-blur border border-yarn-sand/50 p-8 shadow-warm space-y-5">
            {!token || !tokenValid ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-700">
                  {t("auth.invalidToken")}
                </div>
                <Link
                  href="/forgot-password"
                  className="block rounded-xl bg-yarn-terracotta px-5 py-2.5 text-center text-sm font-semibold text-white shadow-warm-sm transition-colors hover:bg-yarn-terracotta-hover"
                >
                  {t("auth.requestNewLink")}
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-yarn-charcoal">
                    {t("auth.newPassword")}
                  </label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("auth.passwordPlaceholder")}
                    required
                    minLength={8}
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-yarn-charcoal">
                    {t("auth.confirmPassword")}
                  </label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("auth.confirmPasswordPlaceholder")}
                    required
                    minLength={8}
                  />
                </div>

                {error && (
                  <div role="alert" className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "..." : t("auth.resetPasswordSubmit")}
                </Button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
