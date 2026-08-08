import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PublicProfileContent } from "@/components/profile/public-profile-content";

async function loadProfile(usernameParam: string) {
  const username = usernameParam.trim().toLowerCase();
  if (!username) return null;
  // Only public profiles are exposed; a private/nonexistent handle 404s identically.
  return db.user.findFirst({
    where: { username, profilePublic: true },
    select: { id: true, name: true, username: true, bio: true, location: true, website: true }
  });
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const user = await loadProfile(username);
  if (!user || !user.username) return { title: "Crossyarn" };
  const name = user.name?.trim() || user.username;
  return {
    title: `${name} (@${user.username}) — Crossyarn`,
    description: user.bio ?? `Публічні схеми в'язання від ${name} на Crossyarn.`
  };
}

export default async function PublicProfilePage({
  params
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = await loadProfile(username);
  if (!user || !user.username) notFound();

  const patterns = await db.pattern.findMany({
    where: { userId: user.id, visibility: "PUBLIC" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, width: true, height: true, updatedAt: true }
  });

  return (
    <PublicProfileContent
      profile={{
        name: user.name,
        username: user.username,
        bio: user.bio,
        location: user.location,
        website: user.website
      }}
      patterns={patterns.map((p) => ({
        id: p.id,
        title: p.title,
        width: p.width,
        height: p.height,
        updatedAtMs: p.updatedAt.getTime()
      }))}
    />
  );
}
