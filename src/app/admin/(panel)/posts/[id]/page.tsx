import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/guards";
import { parseTags } from "@/lib/utils";
import { ContentEditor } from "@/components/admin/content/content-editor";

function prettyContent(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

export default async function AdminPostEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;

  const post = await db.post.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <ContentEditor
      kind="post"
      data={{
        id: post.id,
        slug: post.slug,
        lang: post.lang as "uk" | "en",
        translationOf: post.translationOf,
        title: post.title,
        heading: post.heading,
        description: post.description,
        tags: parseTags(post.tags),
        coverAssetId: post.coverAssetId,
        coverAlt: post.coverAlt,
        content: prettyContent(post.content),
        status: post.status,
        publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
        updatedAt: post.updatedAt.toISOString()
      }}
    />
  );
}
