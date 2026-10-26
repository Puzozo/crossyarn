import { ForgotPasswordContent } from "@/components/auth/forgot-password-content";

export const metadata = {
  title: "Відновлення пароля — Crossyarn",
  description: "Введіть вашу email-адресу для отримання інструкцій щодо відновлення пароля.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordContent />;
}
