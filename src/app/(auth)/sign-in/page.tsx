import type { Metadata } from "next";
import { requireGuestPage } from "@/lib/auth/guards";
import { SignInContent } from "@/components/auth/sign-in-content";

export const metadata: Metadata = {
  title: "Увійти — Crossyarn"
};

export default async function SignInPage() {
  await requireGuestPage();

  return <SignInContent />;
}
