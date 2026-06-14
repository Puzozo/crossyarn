import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { createEmptyPattern } from "@/lib/patterns/model";
import { createPatternRequestSchema } from "@/lib/patterns/validation";

export async function GET() {
  try {
    const session = await requireSession();
    const patterns = await db.pattern.findMany({
      where: { userId: session.userId },
      orderBy: { updatedAt: "desc" }
    });
    return NextResponse.json(patterns);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createPatternRequestSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Некоректні дані схеми" }, { status: 400 });
  }
  const { title, description, width, height } = parsed.data;
  const patternData = parsed.data.patternData ?? createEmptyPattern(width, height);

  try {
    const pattern = await db.pattern.create({
      data: {
        userId: session.userId,
        title,
        description: description ?? "",
        width,
        height,
        patternData,
        paletteData: patternData.palette,
        symbolSetData: patternData.symbols
      }
    });

    await db.patternVersion.create({
      data: {
        patternId: pattern.id,
        snapshot: patternData
      }
    });

    return NextResponse.json({ id: pattern.id }, { status: 201 });
  } catch (error) {
    console.error("Pattern create failed:", error);
    return NextResponse.json({ error: "Не вдалося створити схему" }, { status: 500 });
  }
}