import { requireGuestPage } from "@/lib/auth/guards";
import { SignUpContent } from "@/components/auth/sign-up-content";

export default async function SignUpPage() {
  await requireGuestPage();

  return <SignUpContent />;
}
