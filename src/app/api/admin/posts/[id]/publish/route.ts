import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/admin-session";
import { postPublishErrors, revalidatePost } from "@/lib/content/repo-shared";

/** Publish a post — 422 with the missing fields if the checklist fails (§7). */
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const post = await db.post.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const missing = postPublishErrors(post);
  if (missing.length > 0) {
    return NextResponse.json({ error: "INCOMPLETE", fields: missing }, { status: 422 });
  }

  const updated = await db.post.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: post.publishedAt ?? new Date() }
  });
  revalidatePost(post.slug);
  return NextResponse.json({ ok: true, status: "PUBLISHED", updatedAt: updated.updatedAt.toISOString() });
}

/** Unpublish — back to DRAFT; publishedAt stays set so the slug remains locked (§7). */
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const post = await db.post.findUnique({ where: { id }, select: { slug: true } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.post.update({ where: { id }, data: { status: "DRAFT" } });
  revalidatePost(post.slug);
  return NextResponse.json({ ok: true, status: "DRAFT", updatedAt: updated.updatedAt.toISOString() });
}
