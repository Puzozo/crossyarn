import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/admin-session";
import {
  ContentApiError,
  createMasterClassSchema,
  resolveNewSlug,
  parseIncomingContent,
  collectPatternEmbedIds,
  assertPatternsVisible,
  resolveTranslationTarget,
  linkTranslation,
  applyMasterClassFields
} from "@/lib/content/repo-shared";

const PAGE_SIZE = 20;

/** Admin list of master classes: filter by status / lang, search by title (§8). */
export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const status = params.get("status");
  const lang = params.get("lang");
  const q = (params.get("q") ?? "").trim();
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);

  const where: Prisma.MasterClassWhereInput = {};
  if (status && ["DRAFT", "PUBLISHED", "PENDING_REVIEW", "REJECTED"].includes(status)) {
    where.status = status as Prisma.MasterClassWhereInput["status"];
  }
  if (lang === "uk" || lang === "en") where.lang = lang;
  if (q) where.title = { contains: q };

  const [total, items] = await Promise.all([
    db.masterClass.count({ where }),
    db.masterClass.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
      select: {
        id: true,
        title: true,
        slug: true,
        lang: true,
        status: true,
        difficulty: true,
        publishedAt: true,
        updatedAt: true,
        translationOfId: true
      }
    })
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE))
  });
}

/** Create a master-class draft (§6). */
export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const input = createMasterClassSchema.parse(await request.json().catch(() => null));
    const slug = resolveNewSlug(input.slug, input.title, false);

    const content = input.content !== undefined ? parseIncomingContent(input.content) : undefined;
    await assertPatternsVisible([input.mainPatternId, ...(content ? collectPatternEmbedIds(content) : [])]);

    if (input.translationOfId) {
      await resolveTranslationTarget(input.translationOfId, input.lang, null);
    }

    const existingSlug = await db.masterClass.findUnique({ where: { slug }, select: { id: true } });
    if (existingSlug) throw new ContentApiError(409, { error: "SLUG_TAKEN" });

    const data: Record<string, unknown> = { authorId: session.userId, slug, lang: input.lang, title: input.title };
    applyMasterClassFields(data, input, content);

    const created = await db.$transaction(async (tx) => {
      const mc = await tx.masterClass.create({ data: data as Prisma.MasterClassUncheckedCreateInput });
      if (input.translationOfId) await linkTranslation(tx, mc.id, input.translationOfId);
      return mc;
    });

    return NextResponse.json({ id: created.id, slug: created.slug }, { status: 201 });
  } catch (error) {
    if (error instanceof ContentApiError) return NextResponse.json(error.body, { status: error.status });
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Некоректні дані" }, { status: 400 });
    console.error("Master class create failed:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
