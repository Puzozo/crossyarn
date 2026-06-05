import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSession } from "@/lib/auth/admin-session";
import { verifyUser } from "@/lib/auth/users";
import { checkRateLimit } from "@/lib/auth/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const { allowed, retryAfterSeconds } = checkRateLimit(`admin-sign-in:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: `Забагато спроб. Спробуйте через ${retryAfterSeconds} сек.` },
      { status: 429 }
    );
  }

  try {
    const body = schema.parse(await request.json());
    const user = await verifyUser(body.email, body.password);
    if (!user || !user.isAdmin) {
      return NextResponse.json({ error: "Невірний email або пароль" }, { status: 401 });
    }
    if (user.isDisabled) {
      return NextResponse.json({ error: "Акаунт заблоковано" }, { status: 403 });
    }
    await createAdminSession({ userId: user.id, email: user.email });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Некоректні дані" }, { status: 400 });
    }
    return NextResponse.json({ error: "Помилка сервера" }, { status: 500 });
  }
}
