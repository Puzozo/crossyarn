import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/guards";
import { parseTags } from "@/lib/utils";
import { ContentEditor } from "@/components/admin/content/content-editor";

function safeJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function prettyContent(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export default async function AdminMasterClassEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;

  const mc = await db.masterClass.findUnique({ where: { id } });
  if (!mc) notFound();

  const [mainPattern, translationPartner] = await Promise.all([
    mc.mainPatternId
      ? db.pattern.findUnique({ where: { id: mc.mainPatternId }, select: { id: true, title: true } })
      : Promise.resolve(null),
    mc.translationOfId
      ? db.masterClass.findUnique({ where: { id: mc.translationOfId }, select: { id: true, title: true, lang: true } })
      : Promise.resolve(null)
  ]);

  return (
    <ContentEditor
      kind="masterClass"
      data={{
        id: mc.id,
        slug: mc.slug,
        lang: mc.lang as "uk" | "en",
        translationOfId: mc.translationOfId,
        title: mc.title,
        summary: mc.summary,
        coverAssetId: mc.coverAssetId,
        coverAlt: mc.coverAlt,
        difficulty: mc.difficulty,
        durationMinutes: mc.durationMinutes,
        materials: safeJson(mc.materials, { yarn: [], tools: [], other: [] }),
        tags: parseTags(mc.tags),
        mainPatternId: mc.mainPatternId,
        gallery: safeJson(mc.gallery, []),
        content: prettyContent(mc.content),
        status: mc.status,
        publishedAt: mc.publishedAt ? mc.publishedAt.toISOString() : null,
        priceUah: mc.priceUah,
        previewBlockCount: mc.previewBlockCount,
        updatedAt: mc.updatedAt.toISOString()
      }}
      mainPattern={mainPattern}
      translationPartner={translationPartner}
    />
  );
}
