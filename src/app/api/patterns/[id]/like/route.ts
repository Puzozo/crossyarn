import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

/**
 * Like / unlike a pattern. A pattern can be liked by anyone who can view it:
 * PUBLIC and UNLISTED by any signed-in user, PRIVATE only by the owner
 * (404 otherwise, so ids aren't probeable — same rule as /p/[id]).
 * Both verbs are idempotent and return the fresh { liked, count }.
 */
async function loadLikeablePattern(id: string, userId: string) {
  const pattern = await db.pattern.findUnique({
    where: { id },
    select: { id: true, userId: true, visibility: true }
  });
  if (!pattern) return null;
  if (pattern.visibility === "PRIVATE" && pattern.userId !== userId) return null;
  return pattern;
}

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;

    const pattern = await loadLikeablePattern(id, session.userId);
    if (!pattern) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.patternLike.upsert({
      where: { userId_patternId: { userId: session.userId, patternId: id } },
      create: { userId: session.userId, patternId: id },
      update: {}
    });

    const count = await db.patternLike.count({ where: { patternId: id } });
    return NextResponse.json({ liked: true, count });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;

    await db.patternLike.deleteMany({
      where: { userId: session.userId, patternId: id }
    });

    const count = await db.patternLike.count({ where: { patternId: id } });
    return NextResponse.json({ liked: false, count });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
