import { requireUserPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getAvailableSymbols } from "@/lib/patterns/user-symbols";
import { AccountContent } from "@/components/account/account-content";

export default async function AccountPage() {
  const session = await requireUserPage();
  const [symbols, user] = await Promise.all([
    getAvailableSymbols(session.userId),
    db.user.findUnique({
      where: { id: session.userId },
      select: {
        name: true,
        username: true,
        bio: true,
        location: true,
        website: true,
        profilePublic: true
      }
    })
  ]);

  return (
    <AccountContent
      email={session.email}
      userId={session.userId}
      symbols={symbols}
      profile={{
        name: user?.name ?? "",
        username: user?.username ?? "",
        bio: user?.bio ?? "",
        location: user?.location ?? "",
        website: user?.website ?? "",
        profilePublic: user?.profilePublic ?? false
      }}
    />
  );
}
