import { requireGuestPage } from "@/lib/auth/guards";
import { SignInContent } from "@/components/auth/sign-in-content";

export default async function SignInPage() {
  await requireGuestPage();

  return <SignInContent />;
}
