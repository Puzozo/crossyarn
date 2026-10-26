/**
 * Fills Pattern.titleTranslit for patterns created before the column existed
 * (or by code paths that didn't set it), so /explore search finds them.
 *
 * Run (local or on the VPS, from the project root): npx tsx scripts/backfill-title-translit.ts
 * Idempotent — only touches rows whose titleTranslit is empty.
 */
import { PrismaClient } from "@prisma/client";
import { translit } from "../src/lib/translit";

const db = new PrismaClient();

async function main() {
  const rows = await db.pattern.findMany({
    where: { OR: [{ titleTranslit: "" }, { titleTranslit: null }] },
    select: { id: true, title: true }
  });
  for (const row of rows) {
    await db.pattern.update({
      where: { id: row.id },
      data: { titleTranslit: translit(row.title) }
    });
  }
  console.log(`titleTranslit backfilled for ${rows.length} pattern(s)`);
}

main().finally(() => db.$disconnect());
