import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isMediaWidth, readMediaVariant } from "@/lib/content/media";

export const runtime = "nodejs";

/**
 * Serve a stored WebP variant (§4). Public — draft covers are not secret and ids are
 * unguessable. The file is only reachable via a DB record, never by raw filename.
 */
export async function GET(_: Request, { params }: { params: Promise<{ id: string; w: string }> }) {
  const { id, w } = await params;
  const width = Number(w);
  if (!isMediaWidth(width)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const asset = await db.mediaAsset.findUnique({ where: { id }, select: { variants: true } });
  if (!asset) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  let filename: string | undefined;
  try {
    filename = (JSON.parse(asset.variants) as Record<string, string>)[String(width)];
  } catch {
    filename = undefined;
  }
  if (!filename) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const data = await readMediaVariant(filename);
  if (!data) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
