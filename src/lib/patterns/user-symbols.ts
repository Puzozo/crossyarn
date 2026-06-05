import { db } from "@/lib/db";
import { DEFAULT_SYMBOLS, PatternSymbol } from "@/lib/patterns/model";

export async function getUserSymbols(userId: string): Promise<PatternSymbol[]> {
  const records = await db.userSymbol.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" }
  });

  return records.map((record) => ({
    id: `user-${record.id}`,
    label: record.name,
    imageData: record.imageData,
    description: record.description,
    source: "user" as const,
    width: record.width > 1 ? record.width : undefined,
    height: record.height > 1 ? record.height : undefined
  }));
}

async function getOfficialSymbols(): Promise<PatternSymbol[]> {
  const records = await db.userSymbol.findMany({
    where: { isOfficial: true, builtinId: null },
    orderBy: { createdAt: "asc" }
  });
  return records.map((record) => ({
    id: `official-${record.id}`,
    label: record.name,
    imageData: record.imageData,
    description: record.description,
    source: "user" as const,
    width: record.width > 1 ? record.width : undefined,
    height: record.height > 1 ? record.height : undefined
  }));
}

async function getBuiltinOverrides(): Promise<Map<string, PatternSymbol>> {
  const records = await db.userSymbol.findMany({
    where: { builtinId: { not: null } }
  });
  const map = new Map<string, PatternSymbol>();
  for (const record of records) {
    if (record.builtinId) {
      map.set(record.builtinId, {
        id: record.builtinId,
        label: record.name,
        imageData: record.imageData,
        description: record.description,
        source: "builtin" as const,
        width: record.width > 1 ? record.width : undefined,
        height: record.height > 1 ? record.height : undefined
      });
    }
  }
  return map;
}

export async function getAvailableSymbols(userId: string): Promise<PatternSymbol[]> {
  const [userSymbols, officialSymbols, overrides] = await Promise.all([
    getUserSymbols(userId),
    getOfficialSymbols(),
    getBuiltinOverrides()
  ]);

  const defaults = DEFAULT_SYMBOLS.map((s) => overrides.get(s.id) ?? s);

  return [...defaults, ...officialSymbols, ...userSymbols];
}
