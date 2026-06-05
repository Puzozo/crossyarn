import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getAdminSession } from "@/lib/auth/admin-session";

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

export async function requireAdminPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }
  return session;
}