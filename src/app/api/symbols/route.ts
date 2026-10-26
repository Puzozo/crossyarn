import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { limitWrite } from "@/lib/auth/rate-limit";
import { getAvailableSymbols } from "@/lib/patterns/user-symbols";
import { isSafeImageDataUri, MAX_SYMBOL_IMAGE_BYTES } from "@/lib/patterns/image-data";

const createSymbolSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().min(2).max(300),
  imageData: z.string().max(MAX_SYMBOL_IMAGE_BYTES).refine(isSafeImageDataUri, "Must be a base64 image data URI"),
  width: z.number().int().min(1).max(6).optional(),
  height: z.number().int().min(1).max(6).optional()
});

export async function GET() {
  try {
    const session = await requireSession();
    const symbols = await getAvailableSymbols(session.userId);
    return NextResponse.json(symbols);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const limited = limitWrite(session.userId, "create");
    if (limited) return limited;
    const body = createSymbolSchema.parse(await request.json().catch(() => null));
    const symbol = await db.userSymbol.create({
      data: {
        userId: session.userId,
        name: body.name,
        description: body.description,
        imageData: body.imageData,
        width: body.width ?? 1,
        height: body.height ?? 1
      }
    });
    return NextResponse.json(symbol, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Некоректні дані позначки" }, { status: 400 });
    }
    return NextResponse.json({ error: "Не вдалося зберегти позначку" }, { status: 500 });
  }
}
