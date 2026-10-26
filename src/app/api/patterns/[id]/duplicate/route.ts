import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { limitWrite } from "@/lib/auth/rate-limit";
import { translit } from "@/lib/translit";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const limited = limitWrite(session.userId, "create");
    if (limited) return limited;
    const { id } = await params;

    const existing = await db.pattern.findFirst({
      where: { id, userId: session.userId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Keep within the 120-char title limit enforced on create/update.
    const suffix = " (копія)";
    const title = existing.title.slice(0, 120 - suffix.length) + suffix;

    const duplicate = await db.pattern.create({
      data: {
        userId: session.userId,
        title,
        titleTranslit: translit(title),
        tags: existing.tags,
        description: existing.description,
        width: existing.width,
        height: existing.height,
        patternData: existing.patternData ?? {},
        paletteData: existing.paletteData ?? {},
        symbolSetData: existing.symbolSetData ?? {}
      }
    });

    return NextResponse.json({ id: duplicate.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Не вдалося дублювати схему" }, { status: 400 });
  }
}
