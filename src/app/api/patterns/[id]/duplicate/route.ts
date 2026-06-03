import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const existing = await db.pattern.findFirst({
      where: { id, userId: session.userId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const duplicate = await db.pattern.create({
      data: {
        userId: session.userId,
        title: `${existing.title} (копія)`,
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
