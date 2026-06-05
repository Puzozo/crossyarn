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
    width: record.width > 1 ? record.width : undefined
  }));
}

async function getOfficialSymbols(): Promise<PatternSymbol[]> {
  const records = await db.userSymbol.findMany({
    where: { isOfficial: true },
    orderBy: { createdAt: "asc" }
  });
  return records.map((record) => ({
    id: `official-${record.id}`,
    label: record.name,
    imageData: record.imageData,
    description: record.description,
    source: "user" as const,
    width: record.width > 1 ? record.width : undefined
  }));
}

export async function getAvailableSymbols(userId: string): Promise<PatternSymbol[]> {
  const [userSymbols, officialSymbols] = await Promise.all([
    getUserSymbols(userId),
    getOfficialSymbols()
  ]);
  return [...DEFAULT_SYMBOLS, ...officialSymbols, ...userSymbols];
}