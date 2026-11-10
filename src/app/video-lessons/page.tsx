import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { parseStoredContent } from "@/lib/content/repo-shared";
import type { VideoNode } from "@/lib/content/types";
import { VideoLessonCatalogContent } from "@/components/master-classes/video-lesson-catalog-content";

const PAGE_SIZE = 12;

type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
const LEVELS: Difficulty[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

type SearchParams = { level?: string; lang?: string; page?: string };

function parseLevel(value?: string): Difficulty | null {
  return value && (LEVELS as readonly string[]).includes(value) ? (value as Difficulty) : null;
}

function parseLangFilter(value?: string): "uk" | "en" | null {
  return value === "uk" || value === "en" ? value : null;
}

function parseRequestedPage(value?: string): number {
  return Math.max(1, Number.parseInt(value ?? "1", 10) || 1);
}

/** First YouTube video id in the content doc, or null if there is no video block. */
function extractVideoId(content: string): string | null {
  const doc = parseStoredContent(content);
  const block = doc.content.find((b): b is VideoNode => b.type === "video");
  return block ? block.attrs.videoId : null;
}

const CATALOG_TITLE = "Безкоштовні відеоуроки в'язання — Crossyarn";
const CATALOG_DESCRIPTION =
  "Короткі безкоштовні відеоуроки з в'язання — техніки, прийоми та пояснення на простих прикладах.";

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { level: levelRaw, lang: langRaw, page: pageRaw } = await searchParams;
  const hasFilters = Boolean(parseLevel(levelRaw) || parseLangFilter(langRaw));
  const requestedPage = parseRequestedPage(pageRaw);

  // Filters always collapse canonical to the bare catalog URL (spec §10); only an
  // unfiltered page>1 gets its own self-canonical with a page-number suffix.
  const canonicalPath =
    !hasFilters && requestedPage > 1 ? `/video-lessons?page=${requestedPage}` : "/video-lessons";
  const title = !hasFilters && requestedPage > 1 ? `${CATALOG_TITLE} — сторінка ${requestedPage}` : CATALOG_TITLE;

  return {
    title,
    description: CATALOG_DESCRIPTION,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description: CATALOG_DESCRIPTION,
      url: canonicalPath
    }
  };
}

export default async function VideoLessonsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { level: levelRaw, lang: langRaw, page: pageRaw } = await searchParams;
  const level = parseLevel(levelRaw);
  const langFilter = parseLangFilter(langRaw);
  const requestedPage = parseRequestedPage(pageRaw);

  const where = {
    status: "PUBLISHED" as const,
    kind: "VIDEO_LESSON" as const,
    ...(level ? { difficulty: level } : {}),
    ...(langFilter ? { lang: langFilter } : {})
  };

  const total = await db.masterClass.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (requestedPage > totalPages) notFound();

  const items = await db.masterClass.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    skip: (requestedPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      slug: true,
      title: true,
      content: true,
      durationMinutes: true,
      lang: true
    }
  });

  return (
    <VideoLessonCatalogContent
      items={items.map((mc) => ({
        slug: mc.slug,
        title: mc.title,
        videoId: extractVideoId(mc.content),
        durationMinutes: mc.durationMinutes,
        itemLang: mc.lang as "uk" | "en"
      }))}
      level={level}
      langFilter={langFilter}
      page={requestedPage}
      totalPages={totalPages}
    />
  );
}
