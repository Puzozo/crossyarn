"use client";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";

export function PrintButton() {
  const { t } = useTranslation();

  return (
    <Button variant="secondary" onClick={() => window.print()}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
        <path d="M4 6V1h8v5" />
        <path d="M4 12H2V8a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4h-2" />
        <rect x="4" y="10" width="8" height="5" />
      </svg>
      {t("print.printBtn")}
    </Button>
  );
}
