import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { getClientIp, rateLimitResponse } from "@/lib/auth/rate-limit";

const schema = z.object({
  token: z.string().regex(/^[0-9a-f]{64}$/),
  password: z.string().min(8).max(128)
});

export async function POST(req: Request) {
  const limited = rateLimitResponse(`reset-password:${getClientIp(req)}`, 10, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }
    const { token, password } = parsed.data;

    // Hash the provided token to look up in the database
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with valid reset token
    const user = await db.user.findFirst({
      where: {
        resetToken: tokenHash,
        resetTokenExpiry: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update password, clear reset token and sign out all existing sessions
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        sessionVersion: { increment: 1 },
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
