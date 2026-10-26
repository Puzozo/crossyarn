import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

/**
 * POST /api/patterns/[id]/versions/[versionId]/restore
 * Restores a version snapshot by creating a new PatternVersion entry.
 * Returns the newly created version id.
 */
export async function POST(_: Request, { params }: { params: Promise<{ id: string; versionId: string }> }) {
  try {
    const session = await requireSession();
    const { id, versionId } = await params;

    // Verify ownership
    const owner = await db.pattern.findFirst({
      where: { id, userId: session.userId },
      select: { id: true }
    });
    if (!owner) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const version = await db.patternVersion.findFirst({
      where: { id: versionId, patternId: id },
      select: { snapshot: true }
    });

    if (!version) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Create a new version entry representing this restore point
    const restored = await db.patternVersion.create({
      data: {
        patternId: id,
        snapshot: version.snapshot as any,
      },
      select: { id: true }
    });

    return NextResponse.json({ id: restored.id });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
