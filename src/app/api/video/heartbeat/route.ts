import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireSession } from "@/lib/auth/session";
import { isSameOriginRequest } from "@/lib/auth/same-origin";
import { limitWrite } from "@/lib/auth/rate-limit";
import { DEVICE_COOKIE } from "@/lib/video/device";

// Keeps this device's VideoViewSession alive while the player is visible. If two
// OTHER devices of the same user became active meanwhile, this device is evicted
// (its row deleted) and told to stop — mirrors the limit enforced on embed.
const ACTIVE_WINDOW_MS = 90 * 1000;

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

  const cookieStore = await cookies();
  const deviceId = cookieStore.get(DEVICE_COOKIE)?.value;
  if (!deviceId) {
    return NextResponse.json({ error: "NO_DEVICE" }, { status: 400 });
  }

  const own = await db.videoViewSession.findUnique({
    where: { userId_deviceId: { userId: session.userId, deviceId } },
    select: { id: true }
  });
  if (!own) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const otherActive = await db.videoViewSession.count({
    where: {
      userId: session.userId,
      deviceId: { not: deviceId },
      lastSeenAt: { gte: new Date(Date.now() - ACTIVE_WINDOW_MS) }
    }
  });
  if (otherActive >= 2) {
    await db.videoViewSession.delete({
      where: { userId_deviceId: { userId: session.userId, deviceId } }
    });
    return NextResponse.json({ error: "TOO_MANY_DEVICES" }, { status: 409 });
  }

  await db.videoViewSession.update({
    where: { userId_deviceId: { userId: session.userId, deviceId } },
    data: { lastSeenAt: new Date() }
  });
  return NextResponse.json({ ok: true });
}
