import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile, readFile, rename, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * Media assets (article/master-class images) live on the VPS filesystem in a
 * NON-public directory (never under /public), served only through the immutable
 * GET /api/media/[id]/[w] route that looks the file up by a DB record. Uploads are
 * admin-only, re-encoded to WebP by sharp (EXIF orientation applied, all other
 * metadata dropped), so the client's filename and claimed type never reach disk —
 * each variant is stored as `<assetId>-<w>.webp` with a server-generated id.
 */
// A bare relative default (resolved against the process CWD at runtime by Node's fs)
// avoids a static process.cwd()/path.resolve call, which would make the build's file
// tracer pull the whole project into the standalone bundle (see import-pipeline/storage.ts).
function mediaDir(): string {
  return process.env.MEDIA_UPLOAD_DIR ?? "media-uploads";
}

export const MEDIA_WIDTHS = [480, 960, 1600] as const;
export type MediaWidth = (typeof MEDIA_WIDTHS)[number];

export const MAX_MEDIA_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_PIXELS = 40_000_000; // pixel-bomb guard
const WEBP_QUALITY = 80;

export const ALLOWED_MEDIA_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
const ALLOWED_SHARP_FORMATS = new Set(["jpeg", "png", "webp"]);

export function isMediaWidth(value: unknown): value is MediaWidth {
  return typeof value === "number" && (MEDIA_WIDTHS as readonly number[]).includes(value);
}

export function sha256Hex(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** True when the bytes really are a JPEG/PNG/WebP (the client's MIME type is just a claim). */
export function matchesMediaSignature(bytes: Buffer): boolean {
  if (bytes.length < 12) return false;
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isWebp =
    bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  return isPng || isJpeg || isWebp;
}

export type MediaErrorCode = "INVALID_FORMAT" | "IMAGE_TOO_LARGE";
export class MediaError extends Error {
  constructor(public code: MediaErrorCode) {
    super(code);
    this.name = "MediaError";
  }
}

export type ProcessedMedia = {
  format: string;
  width: number;
  height: number;
  hash: string;
  /** WebP bytes per target width (no upscaling; small sources stay native size). */
  variants: Record<MediaWidth, Buffer>;
};

// At most two concurrent sharp pipelines — each upload is seconds of CPU + memory.
let active = 0;
const waiters: Array<() => void> = [];
function acquire(): Promise<void> {
  return new Promise((resolve) => {
    if (active < 2) {
      active += 1;
      resolve();
    } else {
      waiters.push(resolve);
    }
  });
}
function release(): void {
  active -= 1;
  const next = waiters.shift();
  if (next) {
    active += 1;
    next();
  }
}

/**
 * Decode + validate the upload and produce the three WebP variants. Does NOT touch
 * disk, so a thrown MediaError means nothing was persisted. Rejects anything that is
 * not a JPEG/PNG/WebP (SVG, GIF, corrupt bytes) and images larger than 40 Mpix.
 */
export async function processMedia(bytes: Buffer): Promise<ProcessedMedia> {
  await acquire();
  try {
    const meta = await sharp(bytes, { limitInputPixels: MAX_PIXELS }).metadata();
    const format = meta.format ?? "";
    if (!ALLOWED_SHARP_FORMATS.has(format) || !meta.width || !meta.height) {
      throw new MediaError("INVALID_FORMAT");
    }
    // EXIF orientation 5–8 rotates by 90°, so the oriented dimensions are swapped.
    const swap = (meta.orientation ?? 1) >= 5;
    const width = swap ? meta.height : meta.width;
    const height = swap ? meta.width : meta.height;
    if (width * height > MAX_PIXELS) {
      throw new MediaError("IMAGE_TOO_LARGE");
    }

    const variants = {} as Record<MediaWidth, Buffer>;
    for (const w of MEDIA_WIDTHS) {
      variants[w] = await sharp(bytes, { limitInputPixels: MAX_PIXELS })
        .rotate() // apply EXIF orientation; strips metadata by default
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
    }

    return { format, width, height, hash: sha256Hex(bytes), variants };
  } catch (error) {
    if (error instanceof MediaError) throw error;
    // Corrupt image, decode failure, or sharp's own pixel-limit throw.
    throw new MediaError("INVALID_FORMAT");
  } finally {
    release();
  }
}

/**
 * Write the variants atomically: each goes to a unique tmp file first, then all are
 * renamed into place. On any failure every file written so far is removed, so a
 * half-written asset never survives. Returns the `{ "480": "<file>", ... }` map.
 */
export async function writeMediaVariants(
  id: string,
  variants: Record<MediaWidth, Buffer>
): Promise<Record<string, string>> {
  const dir = mediaDir();
  await mkdir(dir, { recursive: true });

  const finalNames: string[] = [];
  const map: Record<string, string> = {};
  try {
    for (const w of MEDIA_WIDTHS) {
      const finalName = `${id}-${w}.webp`;
      const tmpName = `${finalName}.tmp-${randomUUID()}`;
      await writeFile(path.join(/*turbopackIgnore: true*/ dir, tmpName), variants[w]);
      await rename(path.join(/*turbopackIgnore: true*/ dir, tmpName), path.join(/*turbopackIgnore: true*/ dir, finalName));
      finalNames.push(finalName);
      map[String(w)] = finalName;
    }
    return map;
  } catch (error) {
    await deleteMediaVariants(finalNames);
    throw error;
  }
}

/** Remove the given variant files; used to clean up when the DB write fails. */
export async function deleteMediaVariants(filenames: string[]): Promise<void> {
  const dir = mediaDir();
  await Promise.all(
    filenames.map(async (name) => {
      if (!name || name.includes("/") || name.includes("\\") || name.includes("..")) return;
      try {
        await unlink(path.join(/*turbopackIgnore: true*/ dir, name));
      } catch {
        /* already gone — ignore */
      }
    })
  );
}

/** Read one stored variant by its bare filename. Guards against path traversal. */
export async function readMediaVariant(filename: string): Promise<Buffer | null> {
  if (!filename || filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return null;
  }
  try {
    return await readFile(path.join(/*turbopackIgnore: true*/ mediaDir(), filename));
  } catch {
    return null;
  }
}
