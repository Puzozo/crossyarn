import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

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