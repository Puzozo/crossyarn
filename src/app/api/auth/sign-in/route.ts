import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/auth/session";
import { verifyUser } from "@/lib/auth/users";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const user = await verifyUser(body.email, body.password);
    if (!user) {
      return NextResponse.json({ error: "Невірний email або пароль" }, { status: 401 });
    }
    await createSession({
      userId: user.id,
      email: user.email
    });
    return NextResponse.json({ id: user.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Некоректні дані" }, { status: 400 });
    }
    return NextResponse.json({ error: "Не вдалося виконати вхід" }, { status: 500 });
  }
}