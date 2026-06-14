"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
      <p className="font-display text-7xl font-bold text-yarn-terracotta/40">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-yarn-charcoal">
        {t("notFound.title")}
      </h1>
      <p className="mt-2 max-w-sm text-sm text-yarn-warm-gray">
        {t("notFound.description")}
      </p>
      <Link href="/patterns" className="mt-6">
        <Button>{t("notFound.back")}</Button>
      </Link>
    </div>
  );
}
