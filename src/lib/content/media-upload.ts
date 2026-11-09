import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
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

/**
 * Shared upload pipeline for the admin and user media endpoints. Validates the
 * multipart file, re-encodes it to the three WebP variants and persists one
 * MediaAsset. Auth, same-origin and rate-limiting stay in each route — this only
 * handles the request body, so the admin route keeps its exact behaviour (global
 * dedup, no quota) while the user route scopes dedup + a storage quota to its owner.
 *
 * Lives in its own module (not media.ts) because media.ts is imported by the
 * `scripts/cleanup-media.ts` tsx script, which can't resolve the `@/` alias used
 * for `@/lib/db` / `next/server` here.
 */

export type MediaUploadOptions = {
  ownerId: string;
  /** "owner": dedup only within this owner's assets; "global": any asset (admin legacy). */
  dedupScope: "owner" | "global";
  /** Per-owner cap enforced before storing a genuinely new asset (admin passes none). */
  quota?: { maxCount: number; maxBytes: number };
};

export async function handleMediaUpload(
  request: Request,
  { ownerId, dedupScope, quota }: MediaUploadOptions
): Promise<NextResponse> {
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
  // Cheap signature check rejects SVG/GIF / renamed files before handing anything to sharp.
  if (!matchesMediaSignature(bytes)) {
    return NextResponse.json({ error: "INVALID_FORMAT" }, { status: 400 });
  }

  // Dedup: the same file (byte-identical) reuses the existing asset — no re-processing.
  // User uploads match only their own assets, so a returned id never crosses owners;
  // admin keeps the historical global scope.
  const hash = sha256Hex(bytes);
  const existing = await db.mediaAsset.findFirst({
    where: dedupScope === "owner" ? { hash, ownerId } : { hash },
    select: { id: true, width: true, height: true }
  });
  if (existing) {
    return NextResponse.json({ id: existing.id, width: existing.width, height: existing.height }, { status: 200 });
  }

  // Quota is only checked when a genuinely new asset would be stored (dedup reuses cost nothing).
  if (quota) {
    const usage = await db.mediaAsset.aggregate({
      where: { ownerId },
      _count: true,
      _sum: { sizeBytes: true }
    });
    if (usage._count >= quota.maxCount) {
      return NextResponse.json({ error: "MEDIA_QUOTA_EXCEEDED" }, { status: 429 });
    }
    if ((usage._sum.sizeBytes ?? 0) + bytes.length > quota.maxBytes) {
      return NextResponse.json({ error: "MEDIA_STORAGE_EXCEEDED" }, { status: 413 });
    }
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
        ownerId,
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
