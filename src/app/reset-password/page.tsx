import type { Metadata } from "next";
import { ResetPasswordContent } from "@/components/auth/reset-password-content";

export const metadata: Metadata = {
  title: "Відновлення пароля — Crossyarn",
  description: "Введіть новий пароль для відновлення облікового запису.",
};

export default function ResetPasswordPage() {
  return <ResetPasswordContent />;
}
