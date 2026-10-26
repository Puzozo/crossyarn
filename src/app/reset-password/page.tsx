import type { Metadata } from "next";
import crypto from "crypto";
import { db } from "@/lib/db";
import { ResetPasswordContent } from "@/components/auth/reset-password-content";

export const metadata: Metadata = {
  title: "Відновлення пароля — Crossyarn",
  description: "Введіть новий пароль для відновлення облікового запису.",
  robots: { index: false, follow: false }
};

// Same lookup as POST /api/auth/reset-password, so a used (nulled) or expired
// link shows the "request a new one" state up front instead of a dead form.
async function isTokenValid(token: string | undefined): Promise<boolean> {
  if (!token || token.length > 200) return false;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await db.user.findFirst({
    where: { resetToken: tokenHash, resetTokenExpiry: { gte: new Date() } },
    select: { id: true }
  });
  return Boolean(user);
}

export default async function ResetPasswordPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  const tokenValid = await isTokenValid(typeof token === "string" ? token : undefined);
  return <ResetPasswordContent tokenValid={tokenValid} />;
}
