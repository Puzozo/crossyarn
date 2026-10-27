import type { Metadata } from "next";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ExploreContent } from "@/components/explore/explore-content";
import { parseTags, escapeSqlLike } from "@/lib/utils";
import { translit } from "@/lib/translit";

export const metadata: Metadata = {
  title: "Каталог схем — Crossyarn",
  description:
    "Публічні схеми в'язання від авторів Crossyarn: перегляд, пошук і друк безкоштовних схем.",
  openGraph: {
    title: "Каталог схем — Crossyarn",
    description: "Публічні схеми в'язання від авторів Crossyarn.",
    url: "/explore"
  }
};

const PAGE_SIZE = 24;
const RECENT_CAP = 500;

export default async function ExplorePage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; tag?: string; page?: string }>;
}) {
  const { q, tag, page } = await searchParams;
  const query = (q ?? "").trim();
  const requestedPage = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);

  // Count tag frequency across the full PUBLIC set for the filter bar.
  // Bounded by RECENT_CAP to keep the query fast.
  // Only the 50 most used tags, so one user can't flood the filter bar.
  const tagCounts = new Map<string, number>();
  const allPatterns = await db.pattern.findMany({
    where: { visibility: "PUBLIC" },
    orderBy: { updatedAt: "desc" },
    take: RECENT_CAP,
    select: { tags: true }
  });
  for (const t of allPatterns.flatMap((p) => parseTags(p.tags))) {
    // Skip tags longer than the validation limit (legacy data).
    if (t.length > 40) continue;
    tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }
  const sortedTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 50)
    .map(([t]) => t)
    .sort((a, b) => a.localeCompare(b));

  // Prisma's `contains` filter has no way to pass a LIKE `ESCAPE` clause, so a
  // query/tag containing % or _ would be matched as a SQL wildcard instead of a
  // literal character. Resolve matching ids via a raw, escaped LIKE query first,
  // then let Prisma do the actual (ordered, paginated) fetch over `id IN (...)`.
  const conditions: Prisma.Sql[] = [Prisma.sql`"visibility" = 'PUBLIC'`];
  if (query) {
    // SQLite has no `mode: "insensitive"` and its LIKE folds case only for ASCII.
    // Matching the transliterated query against titleTranslit makes Cyrillic
    // searches case-insensitive too.
    const escapedQuery = `%${escapeSqlLike(query)}%`;
    const escapedTranslit = `%${escapeSqlLike(translit(query))}%`;
    conditions.push(
      Prisma.sql`("title" LIKE ${escapedQuery} ESCAPE '\\' OR "titleTranslit" LIKE ${escapedTranslit} ESCAPE '\\' OR "tags" LIKE ${escapedQuery} ESCAPE '\\')`
    );
  }
  if (tag) {
    const escapedTag = `%${escapeSqlLike(tag)}%`;
    conditions.push(Prisma.sql`"tags" LIKE ${escapedTag} ESCAPE '\\'`);
  }
  const matched = await db.$queryRaw<{ id: string }[]>(
    Prisma.sql`SELECT "id" FROM "Pattern" WHERE ${Prisma.join(conditions, " AND ")}`
  );
  const where: Prisma.PatternWhereInput = { id: { in: matched.map((p) => p.id) } };

  const [total, pageItems] = await Promise.all([
    db.pattern.count({ where }),
    db.pattern.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: PAGE_SIZE,
      skip: (requestedPage - 1) * PAGE_SIZE,
      select: {
        id: true,
        title: true,
        titleTranslit: true,
        tags: true,
        width: true,
        height: true,
        updatedAt: true,
        user: {
          select: { name: true, username: true, profilePublic: true, avatarData: true, updatedAt: true }
        }
      },
    }),
  ]);

  const totalCount = total;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  // Like data only for the visible page (≤24 patterns): counts in one groupBy,
  // the signed-in user's own likes in one findMany.
  const session = await getSession();
  const pageIds = pageItems.map((p) => p.id);
  const [likeGroups, myLikes] = await Promise.all([
    pageIds.length
      ? db.patternLike.groupBy({
          by: ["patternId"],
          where: { patternId: { in: pageIds } },
          _count: { patternId: true }
        })
      : Promise.resolve([]),
    session && pageIds.length
      ? db.patternLike.findMany({
          where: { userId: session.userId, patternId: { in: pageIds } },
          select: { patternId: true }
        })
      : Promise.resolve([])
  ]);
  const likeCountById = new Map(likeGroups.map((g) => [g.patternId, g._count.patternId]));
  const likedIds = new Set(myLikes.map((l) => l.patternId));

  return (
    <ExploreContent
      isAuthenticated={Boolean(session)}
      patterns={pageItems.map((p) => ({
        id: p.id,
        title: p.title,
        width: p.width,
        height: p.height,
        tags: parseTags(p.tags),
        updatedAtMs: p.updatedAt.getTime(),
        likeCount: likeCountById.get(p.id) ?? 0,
        likedByMe: likedIds.has(p.id),
        // Same rule as /p/[id]: attribute only authors with a public profile.
        author:
          p.user.profilePublic && p.user.username
            ? {
                name: p.user.name,
                username: p.user.username,
                avatarUrl: p.user.avatarData
                  ? `/api/users/${p.user.username}/avatar?v=${p.user.updatedAt.getTime()}`
                  : null
              }
            : null
      }))}
      query={query}
      page={currentPage}
      totalPages={totalPages}
      totalCount={totalCount}
      availableTags={sortedTags}
      activeTag={tag ?? null}
    />
  );
}
