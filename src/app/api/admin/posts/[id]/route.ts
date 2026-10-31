import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/admin-session";
import { parseTags } from "@/lib/utils";
import {
  ContentApiError,
  patchPostSchema,
  assertFresh,
  assertSlugAllowed,
  assertSlugNotLocked,
  parseIncomingContent,
  parseStoredContent,
  collectPatternEmbedIds,
  assertPatternsVisible,
  applyPostFields,
  revalidatePost
} from "@/lib/content/repo-shared";

/** Full post record for the admin editor (JSON fields parsed). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const post = await db.post.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...post,
    tags: parseTags(post.tags),
    content: parseStoredContent(post.content)
  });
}

/** Edit a post with optimistic concurrency + slug rules (§7). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = patchPostSchema.parse(await request.json().catch(() => null));

    const existing = await db.post.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    assertFresh(body.updatedAt, existing.updatedAt);

    const data: Record<string, unknown> = {};

    if (body.slug !== undefined) {
      const candidate = (body.slug.length ? body.slug : existing.slug).toLowerCase();
      assertSlugAllowed(candidate, true);
      assertSlugNotLocked(existing.publishedAt, existing.slug, candidate);
      if (candidate !== existing.slug) {
        const clash = await db.post.findFirst({ where: { slug: candidate, NOT: { id } }, select: { id: true } });
        if (clash) throw new ContentApiError(409, { error: "SLUG_TAKEN" });
      }
      data.slug = candidate;
    }

    if (body.lang !== undefined) data.lang = body.lang;
    if (body.translationOf !== undefined) data.translationOf = body.translationOf;

    const content = body.content !== undefined ? parseIncomingContent(body.content) : undefined;
    if (content) await assertPatternsVisible(collectPatternEmbedIds(content));

    applyPostFields(data, body, content);

    await db.post.update({ where: { id }, data });

    const updated = await db.post.findUnique({ where: { id } });
    if (existing.publishedAt) revalidatePost(updated?.slug ?? existing.slug);

    return NextResponse.json({ id, updatedAt: updated?.updatedAt });
  } catch (error) {
    if (error instanceof ContentApiError) return NextResponse.json(error.body, { status: error.status });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Некоректні дані" }, { status: 400 });
    console.error("Post update failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** Delete a post. */
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.post.findUnique({ where: { id }, select: { slug: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.post.delete({ where: { id } });
  revalidatePost(existing.slug);
  return NextResponse.json({ ok: true });
}
