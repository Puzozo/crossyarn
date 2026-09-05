import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

// Re-generate hourly so newly published patterns/profiles appear without a deploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/explore`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/premium`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 }
  ];

  // Only fully PUBLIC patterns are indexed (UNLISTED pages are noindex).
  const patterns = await db.pattern.findMany({
    where: { visibility: "PUBLIC" },
    select: { id: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 5000
  });

  const profiles = await db.user.findMany({
    where: { profilePublic: true, username: { not: null } },
    select: { username: true, updatedAt: true },
    take: 5000
  });

  return [
    ...staticPages,
    ...patterns.map((p) => ({
      url: `${SITE_URL}/p/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7
    })),
    ...profiles.map((u) => ({
      url: `${SITE_URL}/u/${u.username}`,
      lastModified: u.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6
    }))
  ];
}
