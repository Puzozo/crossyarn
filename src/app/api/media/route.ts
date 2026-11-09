import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { isSameOriginRequest } from "@/lib/auth/same-origin";
import { limitWrite } from "@/lib/auth/rate-limit";
import { handleMediaUpload } from "@/lib/content/media-upload";

export const runtime = "nodejs";

// Per-owner storage cap for user uploads (product photos). Dedup reuse never counts
// against it, so re-attaching the same photo is always free.
const USER_MEDIA_MAX_COUNT = 200;
const USER_MEDIA_MAX_BYTES = 200 * 1024 * 1024; // 200 MB

/**
 * User-facing image upload (pattern product photos). Same WebP pipeline as the
 * admin media route, but scoped to the signed-in user: dedup only matches the
 * user's own assets and a per-owner quota guards storage.
 */
export async function POST(request: Request) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const limited = limitWrite(session.userId, "write");
  if (limited) return limited;

  return handleMediaUpload(request, {
    ownerId: session.userId,
    dedupScope: "owner",
    quota: { maxCount: USER_MEDIA_MAX_COUNT, maxBytes: USER_MEDIA_MAX_BYTES }
  });
}
