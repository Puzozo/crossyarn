import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/admin-session";
import { isSameOriginRequest } from "@/lib/auth/same-origin";
import { handleMediaUpload } from "@/lib/content/media-upload";

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

/** Upload + process one image into three WebP variants (admin, global dedup, no quota). */
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return handleMediaUpload(request, { ownerId: session.userId, dedupScope: "global" });
}
