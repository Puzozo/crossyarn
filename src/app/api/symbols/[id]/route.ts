import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

const renameSchema = z.object({
  name: z.string().trim().min(1).max(80)
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const parsed = renameSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Некоректна назва позначки" }, { status: 400 });
    }

    // The id from the editor is prefixed (`user-<recordId>`); strip it to the DB id.
    const recordId = id.startsWith("user-") ? id.slice(5) : id;

    const updated = await db.userSymbol.updateMany({
      where: { id: recordId, userId: session.userId },
      data: { name: parsed.data.name }
    });
    if (updated.count === 0) {
      return NextResponse.json({ error: "Позначку не знайдено" }, { status: 404 });
    }
    return NextResponse.json({ id: recordId, name: parsed.data.name });
  } catch {
    return NextResponse.json({ error: "Не вдалося перейменувати позначку" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    await db.userSymbol.deleteMany({
      where: {
        id,
        userId: session.userId
      }
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Не вдалося видалити позначку" }, { status: 400 });
  }
}