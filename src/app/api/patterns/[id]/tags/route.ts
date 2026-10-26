import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { limitWrite } from "@/lib/auth/rate-limit";
import { parseTags, serializeTags } from "@/lib/utils";

const MAX_TAG_LENGTH = 40;
const MAX_TAGS_PER_PATTERN = 20;
// Letters/digits in any script, plus space, hyphen, underscore.
const TAG_PATTERN = /^[\p{L}\p{N} _-]+$/u;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const limited = limitWrite(session.userId, "write");
    if (limited) return limited;
    const { id } = await params;
    const body = await request.json();
    const tag = typeof body.tag === "string" ? body.tag.trim().toLowerCase() : "";

    if (!tag || tag.length > MAX_TAG_LENGTH || !TAG_PATTERN.test(tag)) {
      return NextResponse.json({ error: "Некоректний тег" }, { status: 400 });
    }

    const existing = await db.pattern.findFirst({
      where: { id, userId: session.userId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const currentTags = parseTags(existing.tags);
    if (currentTags.includes(tag)) {
      return NextResponse.json({ tags: currentTags });
    }

    if (currentTags.length >= MAX_TAGS_PER_PATTERN) {
      return NextResponse.json({ error: "Забагато тегів (максимум 20)" }, { status: 400 });
    }

    const updatedTags = [...currentTags, tag];
    const pattern = await db.pattern.update({
      where: { id },
      data: { tags: serializeTags(updatedTags) }
    });

    return NextResponse.json({ tags: parseTags(pattern.tags) });
  } catch {
    return NextResponse.json({ error: "Не вдалося додати тег" }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const limited = limitWrite(session.userId, "write");
    if (limited) return limited;
    const { id } = await params;
    const body = await request.json();
    const tag = typeof body.tag === "string" ? body.tag.trim() : "";

    if (!tag) {
      return NextResponse.json({ error: "Некоректний тег" }, { status: 400 });
    }

    const existing = await db.pattern.findFirst({
      where: { id, userId: session.userId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const currentTags = parseTags(existing.tags);
    const updatedTags = currentTags.filter((t) => t !== tag);

    const pattern = await db.pattern.update({
      where: { id },
      data: { tags: serializeTags(updatedTags) }
    });

    return NextResponse.json({ tags: parseTags(pattern.tags) });
  } catch {
    return NextResponse.json({ error: "Не вдалося видалити тег" }, { status: 400 });
  }
}
