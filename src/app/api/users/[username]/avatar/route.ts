import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Serves the avatar of a PUBLIC profile as a binary image (referenced from
 * <img> tags with a ?v= cache-buster). Private profiles 404 — their owner sees
 * the avatar on /account via the data URI loaded server-side, never this route.
 */
export async function GET(_: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username: raw } = await params;
  const username = raw.trim().toLowerCase();
  if (!username) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await db.user.findFirst({
    where: { username, profilePublic: true },
    select: { avatarData: true }
  });
  const match = user?.avatarData
    ? /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+=*)$/.exec(user.avatarData)
    : null;
  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(Buffer.from(match[2], "base64"), {
    headers: {
      "Content-Type": match[1],
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400"
    }
  });
}
