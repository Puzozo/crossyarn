import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserPage } from "@/lib/auth/guards";
import { Resend } from "resend";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Normalize email to lowercase for lookup
    const normalizedEmail = email.toLowerCase().trim();

    // Look up the user — we don't leak whether the email exists
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (user) {
      // Generate a random reset token and hash it before storing
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await db.user.update({
        where: { id: user.id },
        data: {
          resetToken: tokenHash,
          resetTokenExpiry: expiry,
        },
      });

      // Build the reset URL
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://crossyarn.online"}/reset-password?token=${rawToken}`;

      // Send the email (UA and EN versions)
      try {
        // Created per request: the constructor throws without RESEND_API_KEY,
        // which at module level breaks `next build` and the whole route.
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.create({
          from: "Crossyarn <noreply@crossyarn.online>",
          to: [normalizedEmail],
          subject: "Відновлення пароля — Crossyarn",
          text: `Привіт!\n\nХтось (ймовірно ви) запросив відновлення пароля для облікового запису Crossyarn.\n\nЯкщо це були ви, перейдіть за посиланням:\n${resetUrl}\n\nПосилання дійсне 24 години.\n\nЯкщо це були не ви — просто ігноруйте цей лист. Ваш пароль не змінився.\n\nЗ повагою,\nКоманда Crossyarn`,
          html: `<p>Привіт!</p><p>Хтось (ймовірно ви) запитав відновлення пароля для облікового запису Crossyarn.</p><p>Якщо це були ви, перейдіть за посиланням:</p><p><a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#C4725A;color:#fff;text-decoration:none;border-radius:8px;">Відновити пароль</a></p><p>Посилання дійсне 24 години.</p><p>Якщо це були не ви — просто ігноруйте цей лист. Ваш пароль не змінився.</p><p>З повагою,<br>Команда Crossyarn</p>`,
        });

        // Also send EN version
        await resend.emails.create({
          from: "Crossyarn <noreply@crossyarn.online>",
          to: [normalizedEmail],
          subject: "Reset your password — Crossyarn",
          text: `Hi!\n\nSomeone (probably you) requested a password reset for your Crossyarn account.\n\nIf this was you, click the link below:\n${resetUrl}\n\nThe link expires in 24 hours.\n\nIf this wasn't you — just ignore this email. Your password hasn't changed.\n\nBest regards,\nThe Crossyarn Team`,
          html: `<p>Hi!</p><p>Someone (probably you) requested a password reset for your Crossyarn account.</p><p>If this was you, click the link below:</p><p><a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#C4725A;color:#fff;text-decoration:none;border-radius:8px;">Reset password</a></p><p>The link expires in 24 hours.</p><p>If this wasn't you — just ignore this email. Your password hasn't changed.</p><p>Best regards,<br>The Crossyarn Team</p>`,
        });
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
