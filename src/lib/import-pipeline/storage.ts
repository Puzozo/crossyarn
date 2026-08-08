import { mkdir, writeFile, readFile, unlink, readdir } from "node:fs/promises";
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

export async function saveImportImage(
  jobId: string,
  bytes: Buffer,
  contentType: string
): Promise<string> {
  const ext = extForType(contentType) ?? "png";
  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  const filename = `${jobId}.${ext}`;
  await writeFile(path.join(dir, filename), bytes);
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
    const data = await readFile(path.join(uploadDir(), filename));
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
    await unlink(path.join(uploadDir(), filename));
  } catch {
    /* already gone — ignore */
  }
}

/** Used by the cleanup sweep: filenames older than `maxAgeMs`. */
export async function listImportImages(): Promise<string[]> {
  try {
    return await readdir(uploadDir());
  } catch {
    return [];
  }
}
