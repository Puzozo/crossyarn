import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { limitWrite } from "@/lib/auth/rate-limit";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(300).optional()
}).refine((data) => data.name !== undefined || data.description !== undefined, {
  message: "Потрібно вказати назву або опис"
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const limited = limitWrite(session.userId, "write");
    if (limited) return limited;
    const { id } = await params;
    const parsed = updateSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Некоректна назва або опис позначки" }, { status: 400 });
    }

    // The id from the editor is prefixed (`user-<recordId>`); strip it to the DB id.
    const recordId = id.startsWith("user-") ? id.slice(5) : id;

    const data: { name?: string; description?: string } = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.description !== undefined) data.description = parsed.data.description;

    const updated = await db.userSymbol.updateMany({
      where: { id: recordId, userId: session.userId },
      data
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: "Позначку не знайдено" }, { status: 404 });
    }
    return NextResponse.json({ id: recordId, name: parsed.data.name, description: parsed.data.description });
  } catch {
    return NextResponse.json({ error: "Не вдалося перейменувати позначку" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const limited = limitWrite(session.userId, "write");
    if (limited) return limited;
    const { id } = await params;
    const { count } = await db.userSymbol.deleteMany({
      where: {
        id,
        userId: session.userId
      }
    });
    if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Не вдалося видалити позначку" }, { status: 400 });
  }
}