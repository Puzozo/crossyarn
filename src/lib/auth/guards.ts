import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export async function requireUserPage() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in");
  }
  return session;
}

export async function requireGuestPage() {
  const session = await getSession();
  if (session) {
    redirect("/patterns");
  }
}