import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/admin-session";
import { MasterClassView } from "@/components/content/master-class-view";

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const admin = await getAdminSession();
  const { id } = await params;
  const mc = admin ? await db.masterClass.findUnique({ where: { id }, select: { title: true } }) : null;
  return {
    title: mc ? `${mc.title} — Прев'ю — Crossyarn` : "Crossyarn",
    robots: { index: false, follow: false }
  };
}

export default async function MasterClassPreviewPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getAdminSession();
  if (!admin) notFound();

  const { id } = await params;
  const mc = await db.masterClass.findUnique({ where: { id } });
  if (!mc) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <MasterClassView
        mc={{
          id: mc.id,
          slug: mc.slug,
          lang: mc.lang,
          title: mc.title,
          summary: mc.summary,
          coverAssetId: mc.coverAssetId,
          coverAlt: mc.coverAlt,
          difficulty: mc.difficulty,
          durationMinutes: mc.durationMinutes,
          mainPatternId: mc.mainPatternId,
          materials: mc.materials,
          gallery: mc.gallery,
          tags: mc.tags,
          content: mc.content,
          priceUah: mc.priceUah,
          previewBlockCount: mc.previewBlockCount,
          publishedAt: mc.publishedAt,
          updatedAt: mc.updatedAt,
          translationOf: null
        }}
        preview
      />
    </div>
  );
}
