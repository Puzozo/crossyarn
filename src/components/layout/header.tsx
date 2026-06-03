import { getSession } from "@/lib/auth/session";
import { HeaderClient } from "@/components/layout/header-client";

export async function Header() {
  const session = await getSession();

  return <HeaderClient isAuthenticated={!!session} />;
}
