export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

// ── Tags (stored as JSON string for SQLite compatibility) ──────────────────

export function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}

export function serializeTags(tags: string[]): string {
  return JSON.stringify(tags);
}