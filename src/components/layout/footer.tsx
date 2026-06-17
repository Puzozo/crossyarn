"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="print:hidden border-t border-yarn-sand/50 bg-white/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-yarn-warm-gray sm:flex-row sm:px-6">
        <p>© {year} Crossyarn</p>
        <nav className="flex items-center gap-5">
          <Link href="/terms" className="hover:text-yarn-charcoal transition-colors">
            {t("footer.terms")}
          </Link>
          <Link href="/privacy" className="hover:text-yarn-charcoal transition-colors">
            {t("footer.privacy")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
