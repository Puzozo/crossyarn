import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/auth/session";
import { verifyUser } from "@/lib/auth/users";
import { getClientIp, rateLimitResponse } from "@/lib/auth/rate-limit";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimitResponse(`sign-in:${ip}`, 5, 60_000);
  if (limited) return limited;

  try {
    const body = schema.parse(await request.json().catch(() => null));
    const user = await verifyUser(body.email, body.password);
    if (!user) {
      return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }
    if (user.isDisabled) {
      return NextResponse.json({ error: "ACCOUNT_DISABLED" }, { status: 403 });
    }
    await createSession({
      userId: user.id,
      email: user.email
    });
    return NextResponse.json({ id: user.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }
    return NextResponse.json({ error: "SIGN_IN_FAILED" }, { status: 500 });
  }
}
