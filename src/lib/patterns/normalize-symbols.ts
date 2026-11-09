import { BUILTIN_ICONS } from "@/lib/patterns/builtin-icons";
import { DEFAULT_SYMBOLS, PatternDocument, PatternSymbol } from "@/lib/patterns/model";
import { db } from "@/lib/db";

const BUILTIN_IDS = new Set(Object.keys(BUILTIN_ICONS));

/**
 * Check whether a symbol's imageData is an old PNG data URI (pre-SVG migration).
 */
function isOldPngDataUri(imageData?: string): boolean {
  return typeof imageData === "string" && imageData.startsWith("data:image/png");
}

/**
 * Replace old PNG builtin icons with new SVG ones.
 * Keeps user symbols and document-only symbols intact.
 * Also ensures new builtin symbols (e.g., multi-cell) are present.
 */
export function hydrateBuiltinSymbols(doc: PatternDocument): PatternDocument {
  let changed = false;
  const nextSymbols: PatternSymbol[] = doc.symbols.map((symbol) => {
    if (
      BUILTIN_IDS.has(symbol.id) &&
      (isOldPngDataUri(symbol.imageData) || !symbol.imageData)
    ) {
      changed = true;
      return {
        ...symbol,
        imageData: BUILTIN_ICONS[symbol.id]
      };
    }
    return symbol;
  });

  // Ensure newly added builtin symbols are available
  const existingIds = new Set(nextSymbols.map((s) => s.id));
  for (const builtin of DEFAULT_SYMBOLS) {
    if (!existingIds.has(builtin.id)) {
      changed = true;
      nextSymbols.push(builtin);
    }
  }

  if (!changed) {
    return doc;
  }

  return {
    ...doc,
    symbols: nextSymbols
  };
}

/**
 * Refresh label/description of user symbols from the UserSymbol table.
 * Stale values snapshotted in the pattern document (last autosave) are
 * replaced with the current owner's symbol metadata.
 */
export async function hydrateUserSymbolLabels(doc: PatternDocument, ownerId: string): Promise<PatternDocument> {
  const userSymbolIds = doc.symbols
    .filter((s) => s.id.startsWith("user-"))
    .map((s) => s.id.slice(5));
  if (userSymbolIds.length === 0) return doc;
  const records = await db.userSymbol.findMany({
    where: { id: { in: userSymbolIds }, userId: ownerId },
    select: { id: true, name: true, description: true }
  });
  if (records.length === 0) return doc;
  const byId = new Map(records.map((r) => [`user-${r.id}`, r]));
  return {
    ...doc,
    symbols: doc.symbols.map((s) => {
      const fresh = byId.get(s.id);
      return fresh ? { ...s, label: fresh.name, description: fresh.description } : s;
    })
  };
}
