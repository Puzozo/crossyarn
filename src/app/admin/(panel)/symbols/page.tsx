import { db } from "@/lib/db";
import { requireAdminPage } from "@/lib/auth/guards";
import { OfficialSymbolManager } from "@/components/admin/official-symbol-manager";
import { DEFAULT_SYMBOLS } from "@/lib/patterns/model";

export default async function AdminSymbolsPage() {
  await requireAdminPage();

  const symbols = await db.userSymbol.findMany({
    where: { isOfficial: true },
    orderBy: { createdAt: "asc" }
  });

  const builtins = DEFAULT_SYMBOLS.map((s) => ({
    id: s.id,
    name: s.label,
    description: s.description ?? "",
    imageData: s.imageData ?? "",
    width: s.width ?? 1,
    height: s.height ?? 1
  }));

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Глобальні позначки</h1>
        <p className="text-gray-400 text-sm mt-1">
          Символи доступні всім користувачам в редакторі схем
        </p>
      </div>
      <OfficialSymbolManager initialSymbols={symbols} builtinSymbols={builtins} />
    </div>
  );
}
