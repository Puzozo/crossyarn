import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/admin-session";

const createSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(2).max(300),
  imageData: z.string().min(1).refine((v) => v.startsWith("data:image/"), "Must be image data URI"),
  width: z.number().int().min(1).max(6).optional()
});

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const symbols = await db.userSymbol.findMany({
      where: { isOfficial: true },
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json(symbols);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = createSchema.parse(await request.json());
    const symbol = await db.userSymbol.create({
      data: {
        userId: session.userId,
        name: body.name,
        description: body.description,
        imageData: body.imageData,
        width: body.width ?? 1,
        isOfficial: true,
        visibility: "public",
        category: "official"
      }
    });
    return NextResponse.json(symbol, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Некоректні дані" }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
