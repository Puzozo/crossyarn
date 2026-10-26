import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

/**
 * GET /api/patterns/[id]/versions/[versionId]
 * Returns the full snapshot for a specific version.
 */
export async function GET(_: Request, { params }: { params: Promise<{ id: string; versionId: string }> }) {
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

    return NextResponse.json({ snapshot: version.snapshot });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
