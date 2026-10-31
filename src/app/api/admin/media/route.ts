import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/admin-session";
import { isSameOriginRequest } from "@/lib/auth/same-origin";
import {
  ALLOWED_MEDIA_MIME,
  MAX_MEDIA_BYTES,
  MediaError,
  matchesMediaSignature,
  processMedia,
  writeMediaVariants,
  deleteMediaVariants,
  sha256Hex
} from "@/lib/content/media";

export const runtime = "nodejs";

const PAGE_SIZE = 40;

/** Media library listing (admin), newest first, cursor pagination (§4). */
export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cursor = new URL(request.url).searchParams.get("cursor");
  const items = await db.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: { id: true, originalName: true, width: true, height: true, sizeBytes: true, createdAt: true }
  });

  const hasMore = items.length > PAGE_SIZE;
  const page = hasMore ? items.slice(0, PAGE_SIZE) : items;
  return NextResponse.json({
    items: page,
    nextCursor: hasMore ? page[page.length - 1]?.id ?? null : null
  });
}

/** Upload + process one image into three WebP variants (admin). */
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Reject oversized bodies before buffering them (multipart adds some overhead on top).
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength && contentLength > MAX_MEDIA_BYTES + 1024 * 1024) {
    return NextResponse.json({ error: "IMAGE_TOO_LARGE" }, { status: 413 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "INVALID_FILE" }, { status: 400 });
  }
  if (!(ALLOWED_MEDIA_MIME as readonly string[]).includes(file.type)) {
    return NextResponse.json({ error: "INVALID_FORMAT" }, { status: 400 });
  }
  if (file.size > MAX_MEDIA_BYTES) {
    return NextResponse.json({ error: "IMAGE_TOO_LARGE" }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > MAX_MEDIA_BYTES) {
    return NextResponse.json({ error: "IMAGE_TOO_LARGE" }, { status: 413 });
  }
  // Cheap signature check rejects SVG/GIF before handing anything to sharp.
  if (!matchesMediaSignature(bytes)) {
    return NextResponse.json({ error: "INVALID_FORMAT" }, { status: 400 });
  }

  // Dedup: the same file (byte-identical) reuses the existing asset — no re-processing.
  const hash = sha256Hex(bytes);
  const existing = await db.mediaAsset.findFirst({ where: { hash }, select: { id: true, width: true, height: true } });
  if (existing) {
    return NextResponse.json({ id: existing.id, width: existing.width, height: existing.height }, { status: 200 });
  }

  let processed;
  try {
    processed = await processMedia(bytes);
  } catch (error) {
    if (error instanceof MediaError) {
      // Corrupt / wrong format / too many pixels — nothing was written to disk.
      return NextResponse.json({ error: error.code }, { status: 422 });
    }
    console.error("Media processing failed:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }

  // Atomic: files first (tmp → rename), then the DB row; clean up the files if it fails.
  const id = randomUUID();
  let variantFilenames: string[] = [];
  try {
    const variants = await writeMediaVariants(id, processed.variants);
    variantFilenames = Object.values(variants);
    const asset = await db.mediaAsset.create({
      data: {
        id,
        ownerId: session.userId,
        kind: "IMAGE",
        originalName: typeof file.name === "string" ? file.name.slice(0, 255) : "image",
        mime: file.type,
        sizeBytes: bytes.length,
        width: processed.width,
        height: processed.height,
        hash,
        variants: JSON.stringify(variants)
      }
    });
    return NextResponse.json({ id: asset.id, width: asset.width, height: asset.height }, { status: 201 });
  } catch (error) {
    await deleteMediaVariants(variantFilenames);
    console.error("Media create failed:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
