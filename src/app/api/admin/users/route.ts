import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/admin-session";

export async function GET(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 100);
    const offset = Number(searchParams.get("offset") ?? "0");

    const where = search
      ? { email: { contains: search.toLowerCase() } }
      : {};

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          email: true,
          name: true,
          isAdmin: true,
          isDisabled: true,
          createdAt: true,
          _count: { select: { patterns: true, symbols: true } }
        }
      }),
      db.user.count({ where })
    ]);

    return NextResponse.json({
      users: users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })),
      total
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
