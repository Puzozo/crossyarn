import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { PatternDocument, PatternSymbol } from "@/lib/patterns/model";
import { hydrateBuiltinSymbols } from "@/lib/patterns/normalize-symbols";
import { PublicPatternContent } from "@/components/patterns/public-pattern-content";

async function loadPattern(id: string) {
  const pattern = await db.pattern.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, username: true, profilePublic: true } }
    }
  });
  if (!pattern) return null;

  // PRIVATE patterns are viewable only by their owner; UNLISTED/PUBLIC by anyone.
  if (pattern.visibility === "PRIVATE") {
    const session = await getSession();
    if (session?.userId !== pattern.userId) return null;
  }
  return pattern;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const pattern = await loadPattern(id);
  if (!pattern) return { title: "Crossyarn" };
  const description =
    pattern.description ?? `Схема в'язання ${pattern.width} × ${pattern.height} на Crossyarn.`;
  return {
    title: `${pattern.title} — Crossyarn`,
    description,
    // OG on UNLISTED too — link previews are the whole point of link-sharing.
    openGraph: {
      title: pattern.title,
      description,
      url: `/p/${id}`
    },
    // Only fully public patterns should be indexed; unlisted stays out of search.
    robots: pattern.visibility === "PUBLIC" ? undefined : { index: false, follow: false }
  };
}

export default async function PublicPatternPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pattern = await loadPattern(id);
  if (!pattern) notFound();

  const document = hydrateBuiltinSymbols(pattern.patternData as unknown as PatternDocument);

  const usedSymbolIds = new Set<string>();
  for (const row of document.cells) {
    for (const cell of row) {
      if (cell.occupiedByAnchor) continue;
      usedSymbolIds.add(cell.symbolId);
    }
  }
  usedSymbolIds.delete("empty");
  const usedSymbols: PatternSymbol[] = document.symbols.filter((s) => usedSymbolIds.has(s.id));

  const author =
    pattern.user.profilePublic && pattern.user.username
      ? { name: pattern.user.name, username: pattern.user.username }
      : null;

  return (
    <PublicPatternContent
      pattern={{
        title: pattern.title,
        description: pattern.description,
        width: pattern.width,
        height: pattern.height
      }}
      document={document}
      usedSymbols={usedSymbols}
      author={author}
    />
  );
}
