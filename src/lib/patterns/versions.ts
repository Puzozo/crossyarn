import { db } from "@/lib/db";

// The editor's history panel shows the last 10 versions; older snapshots
// (each up to ~2MB) would otherwise pile up forever with every autosave.
export const MAX_VERSIONS_PER_PATTERN = 10;

export async function pruneVersions(patternId: string): Promise<void> {
  const stale = await db.patternVersion.findMany({
    where: { patternId },
    orderBy: { createdAt: "desc" },
    skip: MAX_VERSIONS_PER_PATTERN,
    select: { id: true }
  });
  if (stale.length === 0) return;
  await db.patternVersion.deleteMany({ where: { id: { in: stale.map((v) => v.id) } } });
}
