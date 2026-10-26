import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { limitWrite } from "@/lib/auth/rate-limit";
import { pruneVersions } from "@/lib/patterns/versions";

/**
 * POST /api/patterns/[id]/versions/[versionId]/restore
 * Restores a version snapshot by creating a new PatternVersion entry.
 * Returns the newly created version id.
 */
export async function POST(_: Request, { params }: { params: Promise<{ id: string; versionId: string }> }) {
  try {
    const session = await requireSession();
    const limited = limitWrite(session.userId, "write");
    if (limited) return limited;
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
        snapshot: version.snapshot as Prisma.InputJsonValue,
      },
      select: { id: true }
    });
    await pruneVersions(id);

    return NextResponse.json({ id: restored.id });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
