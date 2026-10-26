import { mkdir, writeFile, readFile, unlink, readdir, stat } from "node:fs/promises";
import path from "node:path";

/**
 * Source images for image-import jobs live on the VPS filesystem in a NON-public
 * directory (never under /public). They are served only through an authenticated
 * route that checks job ownership, and deleted once the pattern is saved (plus a
 * cron sweep for abandoned jobs). Keeping them off any external service is also a
 * privacy win — uploaded charts never leave our server.
 */
// A bare relative default (resolved against the process CWD at runtime by Node's fs)
// avoids a static process.cwd()/path.resolve call, which would make the build's file
// tracer pull the whole project into the standalone bundle.
function uploadDir(): string {
  return process.env.IMPORT_UPLOAD_DIR ?? "import-uploads";
}

const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp"
};

const TYPE_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp"
};

export function extForType(contentType: string): string | null {
  return EXT_BY_TYPE[contentType] ?? null;
}

/** True when the bytes really are the declared image type (the client's MIME type is just a claim). */
export function matchesImageSignature(bytes: Buffer, contentType: string): boolean {
  switch (contentType) {
    case "image/png":
      return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case "image/jpeg":
      return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    case "image/webp":
      return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
    default:
      return false;
  }
}

export async function saveImportImage(
  jobId: string,
  bytes: Buffer,
  contentType: string
): Promise<string> {
  const ext = extForType(contentType) ?? "png";
  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  const filename = `${jobId}.${ext}`;
  await writeFile(path.join(/*turbopackIgnore: true*/ dir, filename), bytes);
  return filename;
}

export async function readImportImage(
  filename: string
): Promise<{ data: Buffer; contentType: string } | null> {
  // Guard against path traversal — only a bare filename is ever expected.
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return null;
  }
  try {
    const data = await readFile(path.join(/*turbopackIgnore: true*/ uploadDir(), filename));
    const ext = filename.split(".").pop() ?? "";
    return { data, contentType: TYPE_BY_EXT[ext] ?? "application/octet-stream" };
  } catch {
    return null;
  }
}

export async function deleteImportImage(filename: string): Promise<void> {
  if (!filename || filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return;
  }
  try {
    await unlink(path.join(/*turbopackIgnore: true*/ uploadDir(), filename));
  } catch {
    /* already gone — ignore */
  }
}

const SWEEP_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const SWEEP_INTERVAL_MS = 60 * 60 * 1000;
let lastSweepAt = 0;

/**
 * Delete upload files older than 24h (abandoned previews; saved imports are deleted
 * right away via DELETE /api/imports/[id]). Called opportunistically on new uploads
 * and throttled to once an hour, so no cron is needed.
 */
export async function sweepOldImportImages(): Promise<void> {
  const now = Date.now();
  if (now - lastSweepAt < SWEEP_INTERVAL_MS) return;
  lastSweepAt = now;
  for (const name of await listImportImages()) {
    try {
      const info = await stat(path.join(/*turbopackIgnore: true*/ uploadDir(), name));
      if (info.isFile() && now - info.mtimeMs > SWEEP_MAX_AGE_MS) await deleteImportImage(name);
    } catch {
      /* raced with another delete — ignore */
    }
  }
}

/** Filenames currently in the upload dir. */
export async function listImportImages(): Promise<string[]> {
  try {
    return await readdir(/*turbopackIgnore: true*/ uploadDir());
  } catch {
    return [];
  }
}
