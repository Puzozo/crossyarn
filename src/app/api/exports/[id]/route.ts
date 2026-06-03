import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { patternToSvg } from "@/lib/export/pattern-export";
import { PatternDocument } from "@/lib/patterns/model";
import { hydrateBuiltinSymbols } from "@/lib/patterns/normalize-symbols";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const pattern = await db.pattern.findFirst({
      where: {
        id,
        userId: session.userId
      }
    });

    if (!pattern) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const svg = patternToSvg(hydrateBuiltinSymbols(pattern.patternData as unknown as PatternDocument), pattern.title);

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `inline; filename=\"${pattern.title}.svg\"`
      }
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}