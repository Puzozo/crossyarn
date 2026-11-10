import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import type { ReactNode } from "react";
import { db } from "@/lib/db";
import { Language } from "@/lib/i18n/translations";
import { buildContentMetadata } from "@/lib/seo/content-metadata";
import { MasterClassView } from "@/components/content/master-class-view";
import { parseStoredContent } from "@/lib/content/repo-shared";

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
  return lang === "en" ? title + ": Free Video Lesson" : title + ": безкоштовний відеоурок";
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
      ? { lang: mc.translationOf.lang as Language, path: "/video-lessons/" + mc.translationOf.slug }
      : null;

  const description = mc.summary.length > 155 ? mc.summary.slice(0, 152) + "…" : mc.summary;

  return buildContentMetadata({
    path: "/video-lessons/" + mc.slug,
    lang: mc.lang as Language,
    title: metadataTitle(mc.lang, mc.title) + " — Crossyarn",
    description,
    status: mc.status,
    publishedAt: mc.publishedAt,
    updatedAt: mc.updatedAt,
    coverUrl: mc.coverAssetId ? "/api/media/" + mc.coverAssetId + "/1600" : null,
    translation
  });
}

export default async function VideoLessonPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const mc = await loadMasterClass(slug);
  if (!mc) notFound();
  if (mc.kind !== "VIDEO_LESSON") permanentRedirect("/master-classes/" + mc.slug);

  let videoScript: ReactNode = null;
  const videoBlock = parseStoredContent(mc.content).content.find((b) => b.type === "video");
  const videoId = videoBlock && videoBlock.type === "video" ? videoBlock.attrs.videoId : null;
  if (videoId) {
    const videoJsonLd = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: mc.title,
      description: mc.summary,
      thumbnailUrl: ["https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg"],
      uploadDate: (mc.publishedAt ?? mc.updatedAt).toISOString(),
      embedUrl: "https://www.youtube-nocookie.com/embed/" + videoId,
      ...(mc.durationMinutes ? { duration: "PT" + mc.durationMinutes + "M" } : {})
    };
    videoScript = (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
      />
    );
  }

  return (
    <>
      {videoScript}
      <MasterClassView mc={mc} />
    </>
  );
}
