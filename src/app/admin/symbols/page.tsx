import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/guards";
import { OfficialSymbolManager } from "@/components/admin/official-symbol-manager";

export default async function AdminSymbolsPage() {
  await requireAdminPage();

  const symbols = await db.userSymbol.findMany({
    where: { isOfficial: true },
    orderBy: { createdAt: "asc" }
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Глобальні позначки</h1>
        <p className="text-gray-400 text-sm mt-1">
          Символи доступні всім користувачам в редакторі схем
        </p>
      </div>
      <OfficialSymbolManager initialSymbols={symbols} />
    </div>
  );
}
