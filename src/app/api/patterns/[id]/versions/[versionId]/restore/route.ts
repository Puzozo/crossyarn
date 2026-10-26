import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { limitWrite } from "@/lib/auth/rate-limit";
import { pruneVersions } from "@/lib/patterns/versions";
import { patternDocumentSchema } from "@/lib/patterns/validation";
import { hydrateBuiltinSymbols } from "@/lib/patterns/normalize-symbols";

/**
 * POST /api/patterns/[id]/versions/[versionId]/restore
 * Writes the snapshot back into the pattern (like a save) and records it as a new
 * PatternVersion. Returns the new version id; the editor reloads to show it.
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

    // Old snapshots predate some validation rules — never write back a document
    // the renderers can't handle.
    const parsed = patternDocumentSchema.safeParse(version.snapshot);
    if (!parsed.success) {
      return NextResponse.json({ error: "Цю версію неможливо відновити" }, { status: 422 });
    }
    const doc = parsed.data;
    await db.pattern.update({
      where: { id },
      data: {
        width: doc.width,
        height: doc.height,
        patternData: hydrateBuiltinSymbols(doc),
        paletteData: doc.palette,
        symbolSetData: doc.symbols
      }
    });

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
