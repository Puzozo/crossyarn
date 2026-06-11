/**
 * Seeds the local dev database with a test user and a sample pattern
 * for automated UI verification (Playwright MCP).
 *
 * Run: npx tsx scripts/seed-dev.ts
 * Idempotent — safe to run multiple times.
 */
import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";
import { createEmptyPattern } from "../src/lib/patterns/model";

const TEST_EMAIL = "test@crossyarn.local";
const TEST_PASSWORD = "test1234";

const db = new PrismaClient();

async function main() {
  const user = await db.user.upsert({
    where: { email: TEST_EMAIL },
    update: { isAdmin: true, isDisabled: false },
    create: {
      email: TEST_EMAIL,
      passwordHash: hashSync(TEST_PASSWORD, 10),
      name: "Test User",
      isAdmin: true
    }
  });

  const existing = await db.pattern.findFirst({
    where: { userId: user.id, title: "Test Pattern" }
  });

  if (!existing) {
    const doc = createEmptyPattern(24, 24);
    // Place a few symbols incl. a multi-cell one for verification scenarios
    doc.cells[2][2] = { symbolId: "knit", color: doc.palette[1].hex };
    doc.cells[2][3] = { symbolId: "purl", color: doc.palette[2].hex };
    doc.cells[5][5] = { symbolId: "cable-4", color: doc.palette[0].hex };
    for (let c = 6; c <= 8; c++) {
      doc.cells[5][c] = { symbolId: "empty", color: doc.palette[0].hex, occupiedByAnchor: [5, 5] };
    }

    await db.pattern.create({
      data: {
        userId: user.id,
        title: "Test Pattern",
        description: "Seeded pattern for automated UI tests",
        width: doc.width,
        height: doc.height,
        patternData: JSON.parse(JSON.stringify(doc)),
        paletteData: JSON.parse(JSON.stringify(doc.palette)),
        symbolSetData: JSON.parse(JSON.stringify(doc.symbols))
      }
    });
    console.log("Created: Test Pattern");
  }

  console.log(`Seeded. Login: ${TEST_EMAIL} / ${TEST_PASSWORD} (admin)`);
}

main().finally(() => db.$disconnect());
