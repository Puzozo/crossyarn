"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { Footer } from "@/components/layout/footer";
import { useTranslation } from "@/lib/i18n/context";

export function ConditionalLayout({
  header,
  children
}: {
  header: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useTranslation();

  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-yarn-terracotta focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {t("common.skipToContent")}
      </a>
      <div className="print:hidden">{header}</div>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 print:max-w-none print:p-0 focus:outline-none">
        {children}
      </main>
      <Footer />
    </div>
  );
}
