import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/admin-session";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        isDisabled: true,
        createdAt: true,
        patterns: {
          orderBy: { updatedAt: "desc" },
          take: 20,
          select: { id: true, title: true, width: true, height: true, visibility: true, createdAt: true, updatedAt: true }
        },
        symbols: {
          where: { isOfficial: false },
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true, description: true, imageData: true, width: true, createdAt: true }
        }
      }
    });

    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      ...user,
      createdAt: user.createdAt.toISOString(),
      patterns: user.patterns.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString()
      })),
      symbols: user.symbols.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString()
      }))
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

const patchSchema = z.object({
  action: z.enum(["block", "unblock"])
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (id === session.userId) {
      return NextResponse.json({ error: "Не можна заблокувати себе" }, { status: 400 });
    }

    const { action } = patchSchema.parse(await request.json());
    const user = await db.user.update({
      where: { id },
      data: { isDisabled: action === "block" },
      select: { id: true, isDisabled: true }
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
