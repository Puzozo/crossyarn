import { requireUserPage } from "@/lib/auth/guards";
import { getAvailableSymbols } from "@/lib/patterns/user-symbols";
import { AccountContent } from "@/components/account/account-content";

export default async function AccountPage() {
  const session = await requireUserPage();
  const symbols = await getAvailableSymbols(session.userId);

  return (
    <AccountContent
      email={session.email}
      userId={session.userId}
      symbols={symbols}
    />
  );
}
