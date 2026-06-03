import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { createEmptyPattern } from "@/lib/patterns/model";

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
  try {
    const session = await requireSession();
    const body = await request.json().catch(() => ({}));
    const width = Number(body.width) || 24;
    const height = Number(body.height) || 24;
    const patternData = body.patternData ?? createEmptyPattern(width, height);

    const pattern = await db.pattern.create({
      data: {
        userId: session.userId,
        title: typeof body.title === "string" ? body.title : "Нова схема",
        description: typeof body.description === "string" ? body.description : "",
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
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}