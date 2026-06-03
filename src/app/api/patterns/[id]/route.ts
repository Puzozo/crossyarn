import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { updatePatternSchema } from "@/lib/patterns/validation";
import { hydrateBuiltinSymbols } from "@/lib/patterns/normalize-symbols";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const pattern = await db.pattern.findFirst({
      where: {
        id,
        userId: session.userId
      }
    });
    if (!pattern) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(pattern);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const body = updatePatternSchema.parse(await request.json());

    const existing = await db.pattern.findFirst({
      where: {
        id,
        userId: session.userId
      }
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const pattern = await db.pattern.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        width: body.width,
        height: body.height,
        patternData: hydrateBuiltinSymbols(body.patternData),
        paletteData: body.patternData.palette,
        symbolSetData: body.patternData.symbols
      }
    });

    await db.patternVersion.create({
      data: {
        patternId: id,
        snapshot: body.patternData
      }
    });

    return NextResponse.json(pattern);
  } catch {
    return NextResponse.json({ error: "Не вдалося оновити схему" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await db.pattern.deleteMany({
      where: {
        id,
        userId: session.userId
      }
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}