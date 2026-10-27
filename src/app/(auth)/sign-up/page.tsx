import type { Metadata } from "next";
import { requireGuestPage } from "@/lib/auth/guards";
import { SignUpContent } from "@/components/auth/sign-up-content";

export const metadata: Metadata = {
  title: "Реєстрація — Crossyarn"
};

export default async function SignUpPage() {
  await requireGuestPage();

  return <SignUpContent />;
}
