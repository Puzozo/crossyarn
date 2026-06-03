import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/auth/session";
import { createUser } from "@/lib/auth/users";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().max(120).optional()
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const user = await createUser(body.email, body.password, body.name);
    await createSession({
      userId: user.id,
      email: user.email
    });
    return NextResponse.json({ id: user.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Некоректні дані" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "EMAIL_IN_USE") {
      return NextResponse.json({ error: "Цей email уже використовується" }, { status: 409 });
    }
    return NextResponse.json({ error: "Не вдалося створити акаунт" }, { status: 500 });
  }
}