import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/auth/session";
import { verifyUser } from "@/lib/auth/users";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { allowed, retryAfterSeconds } = checkRateLimit(`sign-in:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: `Забагато спроб. Спробуйте через ${retryAfterSeconds} сек.` },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  try {
    const body = schema.parse(await request.json());
    const user = await verifyUser(body.email, body.password);
    if (!user) {
      return NextResponse.json({ error: "Невірний email або пароль" }, { status: 401 });
    }
    if (user.isDisabled) {
      return NextResponse.json({ error: "Акаунт заблоковано" }, { status: 403 });
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
