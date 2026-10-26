import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ExploreContent } from "@/components/explore/explore-content";
import { parseTags } from "@/lib/utils";

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

  // Collect all tags across the full PUBLIC set for the filter bar.
  // Bounded by RECENT_CAP to keep the query fast.
  const allTags = new Set<string>();
  const allPatterns = await db.pattern.findMany({
    where: { visibility: "PUBLIC" },
    orderBy: { updatedAt: "desc" },
    take: RECENT_CAP,
    select: { tags: true }
  });
  for (const t of allPatterns.flatMap((p) => parseTags(p.tags))) allTags.add(t);
  const sortedTags = [...allTags].sort();

  // Build the SQL-like Prisma filter: combine titleTranslit search + tag filter.
  const where: any = { visibility: "PUBLIC" };
  if (query) {
    where.OR = [
      { titleTranslit: { contains: query, mode: "insensitive" } },
      { title: { contains: query, mode: "insensitive" } },
      { tags: { contains: query } },
    ];
  }
  if (tag) {
    where.tags = { contains: tag };
  }

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
