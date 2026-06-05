import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/admin-session";
import { DEFAULT_SYMBOLS } from "@/lib/patterns/model";

const updateSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(2).max(300),
  imageData: z.string().min(1).max(300_000).refine((v) => v.startsWith("data:image/"), "Must be image data URI"),
  width: z.number().int().min(1).max(6),
  height: z.number().int().min(1).max(6)
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ builtinId: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { builtinId } = await params;
    const isValid = DEFAULT_SYMBOLS.some((s) => s.id === builtinId);
    if (!isValid) return NextResponse.json({ error: "Unknown builtin symbol" }, { status: 404 });

    const body = updateSchema.parse(await request.json());

    const symbol = await db.userSymbol.upsert({
      where: { builtinId },
      create: {
        userId: session.userId,
        builtinId,
        name: body.name,
        description: body.description,
        imageData: body.imageData,
        width: body.width,
        height: body.height,
        isOfficial: true,
        visibility: "public",
        category: "builtin"
      },
      update: {
        name: body.name,
        description: body.description,
        imageData: body.imageData,
        width: body.width,
        height: body.height
      }
    });

    return NextResponse.json(symbol);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Некоректні дані" }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ builtinId: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { builtinId } = await params;
    await db.userSymbol.delete({ where: { builtinId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
