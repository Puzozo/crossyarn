import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/admin-session";
import { parseTags } from "@/lib/utils";
import {
  ContentApiError,
  patchMasterClassSchema,
  assertFresh,
  assertSlugAllowed,
  assertSlugNotLocked,
  parseIncomingContent,
  parseStoredContent,
  collectPatternEmbedIds,
  assertPatternsVisible,
  resolveTranslationTarget,
  linkTranslation,
  unlinkTranslation,
  applyMasterClassFields,
  revalidateMasterClass
} from "@/lib/content/repo-shared";

/** Full master-class record for the admin editor (JSON fields parsed). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const mc = await db.masterClass.findUnique({ where: { id } });
  if (!mc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    ...mc,
    tags: parseTags(mc.tags),
    materials: safeJson(mc.materials, { yarn: [], tools: [], other: [] }),
    gallery: safeJson(mc.gallery, []),
    content: parseStoredContent(mc.content)
  });
}

/** Edit a master class with optimistic concurrency + slug/translation rules (§7). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = patchMasterClassSchema.parse(await request.json().catch(() => null));

    const existing = await db.masterClass.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    assertFresh(body.updatedAt, existing.updatedAt);

    const data: Record<string, unknown> = {};

    // Slug: validate + reject renaming a published row.
    if (body.slug !== undefined) {
      const candidate = (body.slug.length ? body.slug : existing.slug).toLowerCase();
      assertSlugAllowed(candidate, false);
      assertSlugNotLocked(existing.publishedAt, existing.slug, candidate);
      if (candidate !== existing.slug) {
        const clash = await db.masterClass.findFirst({
          where: { slug: candidate, NOT: { id } },
          select: { id: true }
        });
        if (clash) throw new ContentApiError(409, { error: "SLUG_TAKEN" });
      }
      data.slug = candidate;
    }

    if (body.lang !== undefined) data.lang = body.lang;
    const finalLang = body.lang ?? existing.lang;

    // Validate only what this request actually writes ("на момент збереження"), so an
    // unrelated edit isn't blocked by a pattern that was flipped private afterwards.
    const content = body.content !== undefined ? parseIncomingContent(body.content) : undefined;
    const patternChecks: Array<string | null | undefined> = [];
    if (body.mainPatternId !== undefined) patternChecks.push(body.mainPatternId);
    if (content) patternChecks.push(...collectPatternEmbedIds(content));
    await assertPatternsVisible(patternChecks);

    applyMasterClassFields(data, body, content);

    // Translation link intent (symmetric; a lang change drops the link unless reset explicitly).
    let intent: { kind: "set"; targetId: string } | { kind: "clear" } | { kind: "keep" };
    if (body.translationOfId !== undefined) {
      intent = body.translationOfId === null ? { kind: "clear" } : { kind: "set", targetId: body.translationOfId };
    } else if (body.lang !== undefined && body.lang !== existing.lang) {
      intent = { kind: "clear" };
    } else {
      intent = { kind: "keep" };
    }
    if (intent.kind === "set") {
      await resolveTranslationTarget(intent.targetId, finalLang, id);
    }

    await db.$transaction(async (tx) => {
      await tx.masterClass.update({ where: { id }, data });
      if (intent.kind === "set") await linkTranslation(tx, id, intent.targetId);
      else if (intent.kind === "clear") await unlinkTranslation(tx, id);
    });

    const updated = await db.masterClass.findUnique({ where: { id } });
    if (existing.publishedAt) revalidateMasterClass(updated?.slug ?? existing.slug);

    return NextResponse.json({ id, updatedAt: updated?.updatedAt });
  } catch (error) {
    if (error instanceof ContentApiError) return NextResponse.json(error.body, { status: error.status });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Некоректні дані" }, { status: 400 });
    console.error("Master class update failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** Delete a master class; the FK (SetNull) clears the translation link on its pair. */
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await db.masterClass.findUnique({ where: { id }, select: { slug: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.masterClass.delete({ where: { id } });
  revalidateMasterClass(existing.slug);
  return NextResponse.json({ ok: true });
}

function safeJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
