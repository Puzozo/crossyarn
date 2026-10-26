import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { limitWrite } from "@/lib/auth/rate-limit";
import { updatePatternSchema } from "@/lib/patterns/validation";
import { hydrateBuiltinSymbols } from "@/lib/patterns/normalize-symbols";
import { pruneVersions } from "@/lib/patterns/versions";
import { translit } from "@/lib/translit";

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
    const limited = limitWrite(session.userId, "save");
    if (limited) return limited;
    const { id } = await params;
    const body = updatePatternSchema.parse(await request.json().catch(() => null));

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
        titleTranslit: translit(body.title),
        description: body.description,
        width: body.width,
        height: body.height,
        patternData: hydrateBuiltinSymbols(body.patternData),
        paletteData: body.patternData.palette,
        symbolSetData: body.patternData.symbols,
        // Only touch visibility when the client sends it; the editor autosave omits it.
        ...(body.visibility ? { visibility: body.visibility } : {})
      }
    });

    await db.patternVersion.create({
      data: {
        patternId: id,
        snapshot: body.patternData
      }
    });
    await pruneVersions(id);

    return NextResponse.json(pattern);
  } catch {
    return NextResponse.json({ error: "Не вдалося оновити схему" }, { status: 400 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const limited = limitWrite(session.userId, "write");
    if (limited) return limited;
    const { id } = await params;
    const body = await request.json().catch(() => null);
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";

    if (title.length < 2 || title.length > 120) {
      return NextResponse.json({ error: "Некоректна назва" }, { status: 400 });
    }
    if (description.length > 500) {
      return NextResponse.json({ error: "Задовгий опис" }, { status: 400 });
    }

    const existing = await db.pattern.findFirst({ where: { id, userId: session.userId } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const pattern = await db.pattern.update({
      where: { id },
      data: { title, titleTranslit: translit(title), description }
    });

    return NextResponse.json({ id: pattern.id, title: pattern.title, description: pattern.description });
  } catch {
    return NextResponse.json({ error: "Не вдалося оновити" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const limited = limitWrite(session.userId, "write");
    if (limited) return limited;
    const { id } = await params;
    const { count } = await db.pattern.deleteMany({
      where: {
        id,
        userId: session.userId
      }
    });
    if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}