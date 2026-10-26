import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { parseTags, serializeTags } from "@/lib/utils";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = await request.json();
    const tag = typeof body.tag === "string" ? body.tag.trim().toLowerCase() : "";

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
    if (currentTags.includes(tag)) {
      return NextResponse.json({ tags: currentTags });
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
