import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserPage } from "@/lib/auth/guards";
import { PatternDocument } from "@/lib/patterns/model";
import { hydrateBuiltinSymbols } from "@/lib/patterns/normalize-symbols";
import { PrintContent } from "@/components/patterns/print-content";

export default async function PatternPrintPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUserPage();
  const { id } = await params;

  const pattern = await db.pattern.findFirst({
    where: {
      id,
      userId: session.userId
    }
  });

  if (!pattern) {
    notFound();
  }

  const document = hydrateBuiltinSymbols(pattern.patternData as unknown as PatternDocument);

  const usedSymbolIds = new Set<string>();
  for (const row of document.cells) {
    for (const cell of row) {
      if (cell.occupiedByAnchor) continue;
      usedSymbolIds.add(cell.symbolId);
    }
  }
  usedSymbolIds.delete("empty");
  const usedSymbols = document.symbols.filter((s) => usedSymbolIds.has(s.id));

  return (
    <PrintContent
      pattern={{
        id: pattern.id,
        title: pattern.title,
        width: pattern.width,
        height: pattern.height,
        updatedAt: pattern.updatedAt.toISOString()
      }}
      document={document}
      usedSymbols={usedSymbols}
    />
  );
}
