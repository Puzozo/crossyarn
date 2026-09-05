import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { ExploreContent } from "@/components/explore/explore-content";

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
/**
 * The catalog is filtered in JS so that search is case-insensitive for
 * Cyrillic too (SQLite LIKE only folds ASCII). The recency cap bounds the
 * scan; once the catalog outgrows it, move filtering into SQL with a
 * normalized title column.
 */
const RECENT_CAP = 500;

export default async function ExplorePage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const query = (q ?? "").trim();
  const requestedPage = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);

  const recent = await db.pattern.findMany({
    where: { visibility: "PUBLIC" },
    orderBy: { updatedAt: "desc" },
    take: RECENT_CAP,
    select: {
      id: true,
      title: true,
      width: true,
      height: true,
      updatedAt: true,
      user: {
        select: { name: true, username: true, profilePublic: true, avatarData: true, updatedAt: true }
      }
    }
  });

  const lowered = query.toLowerCase();
  const filtered = lowered
    ? recent.filter((p) => p.title.toLowerCase().includes(lowered))
    : recent;

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
    />
  );
}
