import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { MasterClassCatalogContent } from "@/components/master-classes/master-class-catalog-content";

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

const CATALOG_TITLE = "Майстер-класи з в'язання спицями та гачком — Crossyarn";
const CATALOG_DESCRIPTION =
  "Покрокові відеоуроки та схеми в'язання — від базових петель до складних жакардових узорів.";

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
    !hasFilters && requestedPage > 1 ? `/master-classes?page=${requestedPage}` : "/master-classes";
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

export default async function MasterClassesPage({
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
      coverAssetId: true,
      coverAlt: true,
      difficulty: true,
      durationMinutes: true,
      lang: true
    }
  });

  return (
    <MasterClassCatalogContent
      items={items.map((mc) => ({
        slug: mc.slug,
        title: mc.title,
        coverAssetId: mc.coverAssetId,
        coverAlt: mc.coverAlt,
        difficulty: mc.difficulty,
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
