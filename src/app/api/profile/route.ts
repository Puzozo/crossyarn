import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { profileUpdateSchema, normalizeWebsite, validateAvatar, RESERVED_USERNAMES } from "@/lib/profile/validation";

export async function PATCH(request: Request) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = profileUpdateSchema.parse(await request.json());

    const name = body.name?.trim() || null;
    const bio = body.bio?.trim() || null;
    const location = body.location?.trim() || null;
    const username = body.username ? body.username.trim().toLowerCase() : null;

    if (username && RESERVED_USERNAMES.has(username)) {
      return NextResponse.json({ error: "USERNAME_RESERVED" }, { status: 409 });
    }

    // A public profile needs a handle to live at /u/<username>.
    if (body.profilePublic && !username) {
      return NextResponse.json({ error: "USERNAME_REQUIRED_FOR_PUBLIC" }, { status: 400 });
    }

    const website = normalizeWebsite(body.website);
    if (!website.ok) {
      return NextResponse.json({ error: "INVALID_WEBSITE" }, { status: 400 });
    }

    const avatar = validateAvatar(body.avatar);
    if (!avatar.ok) {
      return NextResponse.json({ error: "INVALID_AVATAR" }, { status: 400 });
    }

    if (username) {
      const taken = await db.user.findFirst({
        where: { username, NOT: { id: session.userId } },
        select: { id: true }
      });
      if (taken) {
        return NextResponse.json({ error: "USERNAME_TAKEN" }, { status: 409 });
      }
    }

    const updated = await db.user.update({
      where: { id: session.userId },
      data: {
        name,
        username,
        bio,
        location,
        website: website.value,
        avatarData: avatar.value,
        profilePublic: body.profilePublic
      },
      select: {
        name: true,
        username: true,
        bio: true,
        location: true,
        website: true,
        avatarData: true,
        profilePublic: true
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }
    // Unique-constraint race on username (checked above, but two requests can collide).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "USERNAME_TAKEN" }, { status: 409 });
    }
    return NextResponse.json({ error: "UPDATE_FAILED" }, { status: 500 });
  }
}
