import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

/**
 * GET /api/patterns/[id]/versions
 * Returns the last 10 versions for a pattern the user owns.
 */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;

    // Verify ownership
    const owner = await db.pattern.findFirst({
      where: { id, userId: session.userId },
      select: { id: true }
    });
    if (!owner) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const versions = await db.patternVersion.findMany({
      where: { patternId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        createdAt: true,
        snapshot: true
      }
    });

    return NextResponse.json(versions.map((v) => ({
      id: v.id,
      createdAt: v.createdAt,
      // Don't send full snapshot in list (can be large)
      snapshot: null
    })));
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
