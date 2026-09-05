import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { HeaderClient } from "@/components/layout/header-client";

export async function Header() {
  const session = await getSession();

  let user: { initial: string; avatarVersion: number | null } | null = null;
  if (session) {
    const record = await db.user.findUnique({
      where: { id: session.userId },
      select: { name: true, username: true, avatarData: true, updatedAt: true }
    });
    if (record) {
      user = {
        initial: (record.name?.trim() || record.username || session.email).charAt(0).toUpperCase(),
        avatarVersion: record.avatarData ? record.updatedAt.getTime() : null
      };
    }
  }

  return <HeaderClient isAuthenticated={!!session} user={user} />;
}
