import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/admin-session";

const updateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().min(2).max(300).optional(),
  width: z.number().int().min(1).max(6).optional()
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = updateSchema.parse(await request.json());
    const symbol = await db.userSymbol.update({
      where: { id, isOfficial: true },
      data: body
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await db.userSymbol.delete({ where: { id, isOfficial: true } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
