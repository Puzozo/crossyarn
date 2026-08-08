import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { patternToThumbnailSvg } from "@/lib/export/pattern-thumbnail";
import { PatternDocument } from "@/lib/patterns/model";
import { hydrateBuiltinSymbols } from "@/lib/patterns/normalize-symbols";

/**
 * Grid-only SVG preview used by catalog/profile cards.
 * Access mirrors /p/[id]: PUBLIC and UNLISTED are readable by anyone,
 * PRIVATE only by the owner (404 otherwise, so ids aren't probeable).
 *
 * Callers append ?v=<updatedAt ms> as a cache-buster; max-age is kept short
 * so a pattern flipped back to PRIVATE stops being served within the hour.
 */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const pattern = await db.pattern.findUnique({
      where: { id },
      select: { userId: true, visibility: true, patternData: true }
    });
    if (!pattern) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (pattern.visibility === "PRIVATE") {
      const session = await getSession();
      if (session?.userId !== pattern.userId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    const svg = patternToThumbnailSvg(
      hydrateBuiltinSymbols(pattern.patternData as unknown as PatternDocument)
    );

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control":
          pattern.visibility === "PRIVATE"
            ? "private, no-store"
            : "public, max-age=3600, stale-while-revalidate=86400"
      }
    });
  } catch (error) {
    console.error("Thumbnail render failed:", error);
    return NextResponse.json({ error: "Thumbnail failed" }, { status: 500 });
  }
}
