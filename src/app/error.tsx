"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useTranslation();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <p className="font-display text-7xl font-bold text-yarn-terracotta/40">!</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-yarn-charcoal">
        {t("error.title")}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-yarn-warm-gray">
        {t("error.description")}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button onClick={() => reset()}>{t("error.retry")}</Button>
        <Link href="/">
          <Button variant="secondary">{t("error.home")}</Button>
        </Link>
      </div>
      {error.digest && (
        <p className="mt-4 text-xs text-yarn-warm-gray/70 font-mono">{error.digest}</p>
      )}
    </div>
  );
}

