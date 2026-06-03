"use client";

import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { useTranslation } from "@/lib/i18n/context";

export function SignInContent() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md space-y-5">
        {/* Decorative element */}
        <div className="flex justify-center">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-yarn-terracotta opacity-60">
            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="24" cy="24" r="14" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="24" cy="24" r="2" fill="currentColor" />
          </svg>
        </div>
        <AuthForm mode="sign-in" />
        <p className="text-center text-sm text-yarn-warm-gray">
          {t("auth.noAccount")}{" "}
          <Link href="/sign-up" className="font-semibold text-yarn-terracotta hover:text-yarn-terracotta-hover transition-colors">
            {t("auth.register")}
          </Link>
        </p>
      </div>
    </div>
  );
}
