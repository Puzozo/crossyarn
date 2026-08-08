import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { patternVisibilitySchema } from "@/lib/patterns/validation";

const bodySchema = z.object({ visibility: patternVisibilitySchema });

/**
 * Lightweight visibility toggle used by the pattern detail page — updates only
 * the visibility column without touching the pattern document (unlike PUT).
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const { visibility } = bodySchema.parse(await request.json());

    const existing = await db.pattern.findFirst({
      where: { id, userId: session.userId },
      select: { id: true }
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.pattern.update({ where: { id }, data: { visibility } });
    return NextResponse.json({ id, visibility });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 400 });
  }
}
