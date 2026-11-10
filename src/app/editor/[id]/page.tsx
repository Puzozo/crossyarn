import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUserPage } from "@/lib/auth/guards";
import { PatternDocument } from "@/lib/patterns/model";
import { hydrateBuiltinSymbols, hydrateUserSymbolLabels } from "@/lib/patterns/normalize-symbols";
import { EditorPageContent } from "@/components/editor/editor-page-content";
import { parseTags } from "@/lib/utils";

type PatternPhoto = { assetId: string; alt: string };

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const session = await requireUserPage();
  const { id } = await params;
  const pattern = await db.pattern.findFirst({
    where: { id, userId: session.userId },
    select: { title: true }
  });
  if (!pattern) return { title: "Crossyarn", robots: { index: false, follow: false } };
  return {
    title: `${pattern.title} — Crossyarn`,
    robots: { index: false, follow: false }
  };
}

export default async function EditorPage({
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
  const hydratedDocument = await hydrateUserSymbolLabels(document, session.userId);

  let initialPhotos: PatternPhoto[] = [];
  try {
    initialPhotos = JSON.parse(pattern.photos || "[]") as PatternPhoto[];
  } catch {
    initialPhotos = [];
  }

  return (
    <EditorPageContent
      patternId={pattern.id}
      title={pattern.title}
      description={pattern.description}
      initialPattern={hydratedDocument}
      initialTags={parseTags(pattern.tags) ?? []}
      initialPhotos={initialPhotos}
    />
  );
}
