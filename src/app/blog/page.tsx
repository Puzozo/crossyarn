import type { Metadata } from "next";
import { getPostSummaries, type BlogPostSummary } from "@/content/blog";
import { db } from "@/lib/db";
import { parseTags } from "@/lib/utils";
import { BlogList } from "@/components/blog/blog-list";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Блог — Crossyarn",
  description:
    "Гайди та поради зі схем для в'язання: як читати схеми, жаккард, коси, ажур та онлайн-редактор Crossyarn.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Блог — Crossyarn",
    description: "Гайди та поради зі схем для в'язання від Crossyarn.",
    url: "/blog",
  },
};

async function loadDbPostSummaries(): Promise<BlogPostSummary[]> {
  const posts = await db.post.findMany({
    where: { status: "PUBLISHED" },
    select: {
      slug: true,
      lang: true,
      title: true,
      heading: true,
      description: true,
      tags: true,
      translationOf: true,
      coverAssetId: true,
      coverAlt: true,
      publishedAt: true,
      updatedAt: true
    }
  });
  return posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    heading: p.heading,
    description: p.description,
    date: (p.publishedAt ?? p.updatedAt).toISOString().slice(0, 10),
    lang: p.lang as "uk" | "en",
    translationOf: p.translationOf ?? undefined,
    tags: parseTags(p.tags),
    coverAssetId: p.coverAssetId,
    coverAlt: p.coverAlt
  }));
}

export default async function BlogIndexPage() {
  const dbPosts = await loadDbPostSummaries();
  const posts = [...getPostSummaries(), ...dbPosts].sort((a, b) => b.date.localeCompare(a.date));
  return <BlogList posts={posts} />;
}
