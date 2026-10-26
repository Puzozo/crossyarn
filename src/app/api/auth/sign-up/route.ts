import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/auth/session";
import { createUser } from "@/lib/auth/users";
import { getClientIp, rateLimitResponse } from "@/lib/auth/rate-limit";

const schema = z.object({
  email: z.string().email().max(254),
  // bcrypt only uses the first 72 bytes; the cap also bounds hashing cost.
  password: z.string().min(8).max(128).regex(/\d/, "Пароль повинен містити хоча б одну цифру"),
  name: z.string().max(120).optional()
});

export async function POST(request: Request) {
  // Free sign-up + universal Premium would otherwise let one IP mint unlimited accounts.
  const limited = rateLimitResponse(`sign-up:${getClientIp(request)}`, 5, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const body = schema.parse(await request.json());
    const user = await createUser(body.email, body.password, body.name);
    await createSession({
      userId: user.id,
      email: user.email
    });
    return NextResponse.json({ id: user.id });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return NextResponse.json({ error: "Некоректні дані" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "EMAIL_IN_USE") {
      return NextResponse.json({ error: "Цей email уже використовується" }, { status: 409 });
    }
    return NextResponse.json({ error: "Не вдалося створити акаунт" }, { status: 500 });
  }
}