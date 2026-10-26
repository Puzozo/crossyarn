import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimitWindow, getClientIp } from "@/lib/auth/rate-limit";
import { Resend } from "resend";
import crypto from "crypto";

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254)
});

const HOUR_MS = 60 * 60 * 1000;

export async function POST(req: Request) {
  // Every accepted request may send a real email, so cap it per IP...
  const ip = getClientIp(req);
  const { allowed, retryAfterSeconds } = checkRateLimitWindow(`forgot-password:ip:${ip}`, 5, HOUR_MS);
  if (!allowed) {
    const minutes = Math.ceil(retryAfterSeconds / 60);
    return NextResponse.json(
      { error: `Забагато запитів. Спробуйте через ${minutes} хв.` },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const normalizedEmail = parsed.data.email;

    // ...and per address, so one inbox can't be flooded from many IPs. Over the
    // limit we still answer 202 — a different response would leak that it exists.
    const perEmail = checkRateLimitWindow(`forgot-password:email:${normalizedEmail}`, 3, HOUR_MS);

    // Look up the user — we don't leak whether the email exists
    const user = perEmail.allowed
      ? await db.user.findUnique({
          where: { email: normalizedEmail },
          select: { id: true }
        })
      : null;

    if (user) {
      // Generate a random reset token and hash it before storing
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiry = new Date(Date.now() + 24 * HOUR_MS);

      await db.user.update({
        where: { id: user.id },
        data: {
          resetToken: tokenHash,
          resetTokenExpiry: expiry
        }
      });

      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://crossyarn.online"}/reset-password?token=${rawToken}`;
      const button = (label: string) =>
        `<p><a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#C4725A;color:#fff;text-decoration:none;border-radius:8px;">${label}</a></p>`;

      // One bilingual email (UA first, EN below)
      try {
        // Created per request: the constructor throws without RESEND_API_KEY,
        // which at module level breaks `next build` and the whole route.
        const resend = new Resend(process.env.RESEND_API_KEY);
        const { error } = await resend.emails.create({
          from: "Crossyarn <noreply@crossyarn.online>",
          to: [normalizedEmail],
          subject: "Відновлення пароля / Reset your password — Crossyarn",
          text:
            `Привіт!\n\nХтось (ймовірно ви) запросив відновлення пароля для облікового запису Crossyarn.\n\nЯкщо це були ви, перейдіть за посиланням:\n${resetUrl}\n\nПосилання дійсне 24 години.\n\nЯкщо це були не ви — просто ігноруйте цей лист. Ваш пароль не змінився.\n\nЗ повагою,\nКоманда Crossyarn\n\n---\n\n` +
            `Hi!\n\nSomeone (probably you) requested a password reset for your Crossyarn account.\n\nIf this was you, open this link:\n${resetUrl}\n\nThe link expires in 24 hours.\n\nIf this wasn't you — just ignore this email. Your password hasn't changed.\n\nBest regards,\nThe Crossyarn Team`,
          html:
            `<p>Привіт!</p><p>Хтось (ймовірно ви) запросив відновлення пароля для облікового запису Crossyarn.</p><p>Якщо це були ви, перейдіть за посиланням:</p>${button("Відновити пароль")}<p>Посилання дійсне 24 години.</p><p>Якщо це були не ви — просто ігноруйте цей лист. Ваш пароль не змінився.</p><p>З повагою,<br>Команда Crossyarn</p>` +
            `<hr style="border:none;border-top:1px solid #E8DFD3;margin:24px 0;">` +
            `<p>Hi!</p><p>Someone (probably you) requested a password reset for your Crossyarn account.</p><p>If this was you, click the button below:</p>${button("Reset password")}<p>The link expires in 24 hours.</p><p>If this wasn't you — just ignore this email. Your password hasn't changed.</p><p>Best regards,<br>The Crossyarn Team</p>`
        });
        // The SDK reports API failures (bad key, unverified domain) in the
        // result instead of throwing, so they'd be silent without this.
        if (error) console.error("Failed to send password reset email:", error);
      } catch (emailError) {
        // Log the error but don't leak it to the user
        console.error("Failed to send password reset email:", emailError);
      }
    }

    // Always return 202 to prevent email enumeration
    return NextResponse.json({ success: true }, { status: 202 });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
