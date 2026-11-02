import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Language } from "@/lib/i18n/translations";
import { buildContentMetadata } from "@/lib/seo/content-metadata";
import { MasterClassView } from "@/components/content/master-class-view";

async function loadMasterClass(slug: string) {
  const mc = await db.masterClass.findUnique({
    where: { slug },
    include: {
      translationOf: { select: { slug: true, lang: true, status: true } }
    }
  });
  if (!mc || mc.status !== "PUBLISHED") return null;
  return mc;
}

function metadataTitle(lang: string, title: string): string {
  return lang === "en" ? `${title}: Step-by-Step Tutorial` : `${title}: майстер-клас зі схемою`;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const mc = await loadMasterClass(slug);
  if (!mc) return { title: "Crossyarn" };

  const translation =
    mc.translationOf && mc.translationOf.status === "PUBLISHED"
      ? { lang: mc.translationOf.lang as Language, path: `/master-classes/${mc.translationOf.slug}` }
      : null;

  const description = mc.summary.length > 155 ? `${mc.summary.slice(0, 152)}…` : mc.summary;

  return buildContentMetadata({
    path: `/master-classes/${mc.slug}`,
    lang: mc.lang as Language,
    title: `${metadataTitle(mc.lang, mc.title)} — Crossyarn`,
    description,
    status: mc.status,
    publishedAt: mc.publishedAt,
    updatedAt: mc.updatedAt,
    coverUrl: mc.coverAssetId ? `/api/media/${mc.coverAssetId}/1600` : null,
    translation
  });
}

export default async function MasterClassPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const mc = await loadMasterClass(slug);
  if (!mc) notFound();

  return <MasterClassView mc={mc} />;
}
