import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

/**
 * The signed-in user's own avatar (used by the header), regardless of profile
 * publicity. Cached briefly per-user: Vary on Cookie so a shared browser never
 * serves one account's cached avatar to another.
 */
export async function GET() {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { avatarData: true }
  });
  const match = user?.avatarData
    ? /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+=*)$/.exec(user.avatarData)
    : null;
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(Buffer.from(match[2], "base64"), {
    headers: {
      "Content-Type": match[1],
      "Cache-Control": "private, max-age=300",
      Vary: "Cookie"
    }
  });
}
