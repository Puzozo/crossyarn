import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { isSameOriginRequest } from "@/lib/auth/same-origin";
import { limitWrite } from "@/lib/auth/rate-limit";
import { hasProtectedVideoAccess } from "@/lib/content/gate";
import { parseStoredContent } from "@/lib/content/repo-shared";
import { signEmbedUrl, DEFAULT_TTL_SEC } from "@/lib/content/bunny";
import { DEVICE_COOKIE, getOrCreateDeviceId } from "@/lib/video/device";
import { videoViewSession } from "@/lib/video/session-store";

// Hands the client a short-lived signed Bunny embed URL — but only after enforcing
// access (free→any signed-in user, paid→author/admin) AND the concurrent-device
// limit (≤2 devices of the same user watching within the last 90s). The signed URL
// is NEVER rendered into SSR HTML; it only ever leaves the server through here.
const ACTIVE_WINDOW_MS = 90 * 1000;
const STALE_MS = 24 * 60 * 60 * 1000;

const bodySchema = z
  .object({
    masterClassId: z.string().min(1),
    videoId: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  })
  .strict();

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

  let body;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const { masterClassId, videoId } = body;

  const mc = await db.masterClass.findUnique({
    where: { id: masterClassId },
    select: { authorId: true, priceUah: true, content: true }
  });
  if (!mc) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isAdmin = Boolean(
    (await db.user.findUnique({ where: { id: session.userId }, select: { isAdmin: true } }))?.isAdmin
  );

  const canView = hasProtectedVideoAccess({
    userId: session.userId,
    isAdmin,
    priceUah: mc.priceUah,
    authorId: mc.authorId
  });
  if (!canView) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // The requested videoId must actually be a protectedVideo block in THIS master
  // class — otherwise any viewer with access to one MC could sign any Bunny GUID.
  const doc = parseStoredContent(mc.content);
  const videoInContent = doc.content.some(
    (b) => b.type === "protectedVideo" && b.attrs.videoId === videoId
  );
  if (!videoInContent) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cookieStore = await cookies();
  const existingDevice = cookieStore.get(DEVICE_COOKIE)?.value;
  const deviceId = getOrCreateDeviceId(existingDevice);

  const now = Date.now();
  // Opportunistic cleanup of long-abandoned sessions (keeps the table bounded).
  await videoViewSession.deleteMany({ where: { lastSeenAt: { lt: new Date(now - STALE_MS) } } });

  const otherActive = await videoViewSession.count({
    where: {
      userId: session.userId,
      deviceId: { not: deviceId },
      lastSeenAt: { gte: new Date(now - ACTIVE_WINDOW_MS) }
    }
  });
  if (otherActive >= 2) {
    return NextResponse.json({ error: "TOO_MANY_DEVICES" }, { status: 409 });
  }

  const src = signEmbedUrl(videoId);
  if (!src) {
    return NextResponse.json({ error: "UNAVAILABLE" }, { status: 503 });
  }

  await videoViewSession.upsert({
    where: { userId_deviceId: { userId: session.userId, deviceId } },
    create: { userId: session.userId, deviceId, masterClassId },
    update: { masterClassId, lastSeenAt: new Date() }
  });

  const response = NextResponse.json({ url: src, expiresAt: now + DEFAULT_TTL_SEC * 1000 });
  if (!existingDevice) {
    response.cookies.set(DEVICE_COOKIE, deviceId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 400
    });
  }
  return response;
}
