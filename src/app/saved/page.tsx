import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUserPage } from "@/lib/auth/guards";
import { SavedContent } from "@/components/patterns/saved-content";

export const metadata: Metadata = {
  title: "Збережені схеми — Crossyarn",
  robots: { index: false, follow: false }
};

const PAGE_SIZE = 24;

export default async function SavedPage({
  searchParams
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await requireUserPage();
  const { page } = await searchParams;
  const requestedPage = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);

  // A liked pattern stays in the list only while it is still viewable:
  // PUBLIC/UNLISTED by anyone, PRIVATE only when it is the user's own.
  const viewableWhere = {
    userId: session.userId,
    pattern: {
      OR: [{ visibility: { not: "PRIVATE" as const } }, { userId: session.userId }]
    }
  };

  const totalCount = await db.patternLike.count({ where: viewableWhere });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);

  const likes = await db.patternLike.findMany({
    where: viewableWhere,
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      pattern: {
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
      }
    }
  });

  return (
    <SavedContent
      patterns={likes.map(({ pattern: p }) => ({
        id: p.id,
        title: p.title,
        width: p.width,
        height: p.height,
        updatedAtMs: p.updatedAt.getTime(),
        // Same attribution rule as /explore and /p/[id].
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
      page={currentPage}
      totalPages={totalPages}
    />
  );
}
