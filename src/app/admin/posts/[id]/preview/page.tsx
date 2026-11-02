import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/admin-session";
import { PostView } from "@/components/content/post-view";

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const admin = await getAdminSession();
  const { id } = await params;
  const post = admin ? await db.post.findUnique({ where: { id }, select: { title: true } }) : null;
  return {
    title: post ? `${post.title} — Прев'ю — Crossyarn` : "Crossyarn",
    robots: { index: false, follow: false }
  };
}

export default async function PostPreviewPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await getAdminSession();
  if (!admin) notFound();

  const { id } = await params;
  const post = await db.post.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PostView
        post={{
          slug: post.slug,
          lang: post.lang,
          heading: post.heading,
          description: post.description,
          content: post.content,
          coverAssetId: post.coverAssetId,
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt
        }}
        preview
      />
    </div>
  );
}
