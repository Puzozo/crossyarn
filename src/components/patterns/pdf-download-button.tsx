"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/context";
import { downloadPatternAsPdf } from "@/lib/export/pdf-export";

type Props = {
  patternId: string;
  title: string;
};

export function PdfDownloadButton({ patternId, title }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await downloadPatternAsPdf(patternId, title);
    } catch {
      // silently ignore — user can use print as fallback
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" onClick={handleClick} disabled={loading}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
        <path d="M8 2v8M5 7l3 3 3-3" />
        <path d="M2 13h12" />
      </svg>
      {loading ? t("pdf.generating") : t("pdf.download")}
    </Button>
  );
}
