import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { patternToSvg } from "@/lib/export/pattern-export";
import { PatternDocument } from "@/lib/patterns/model";
import { hydrateBuiltinSymbols } from "@/lib/patterns/normalize-symbols";
import { readMediaVariant } from "@/lib/content/media";
import { Language } from "@/lib/i18n/translations";

/**
 * HTTP headers only allow Latin-1, so non-ASCII titles (e.g. Cyrillic) must be
 * RFC 5987-encoded via filename*; a sanitized ASCII filename is kept as fallback.
 */
function inlineDisposition(filename: string) {
  // Strip non-ASCII (control chars included) and characters that could break the header
  const fallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/["<>;\\]/g, "'");
  const encoded = encodeURIComponent(filename);
  return `inline; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const photosRaw = JSON.parse(pattern.photos || "[]") as { assetId: string; alt: string }[];
    let photo: { dataUri: string; width: number; height: number } | undefined;
    if (photosRaw[0]) {
      const asset = await db.mediaAsset.findUnique({
        where: { id: photosRaw[0].assetId },
        select: { width: true, height: true, variants: true }
      });
      if (asset) {
        let filename: string | undefined;
        try {
          filename = (JSON.parse(asset.variants) as Record<string, string>)["480"];
        } catch {
          filename = undefined;
        }
        const buf = filename ? await readMediaVariant(filename) : null;
        if (buf) {
          photo = { dataUri: `data:image/webp;base64,${buf.toString("base64")}`, width: asset.width, height: asset.height };
        }
      }
    }

    const lang: Language = new URL(request.url).searchParams.get("lang") === "en" ? "en" : "uk";
    const svg = patternToSvg(hydrateBuiltinSymbols(pattern.patternData as unknown as PatternDocument), pattern.title, photo, lang);

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": inlineDisposition(`${pattern.title}.svg`)
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("SVG export failed:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}