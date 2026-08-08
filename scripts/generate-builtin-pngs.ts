/**
 * Generate 64x64 PNG icons for standard knitting symbols using node-canvas.
 * Drawings live in ./symbol-drawings.ts (shared with the dataset generator).
 * Run: npx tsx scripts/generate-builtin-pngs.ts
 */
import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { DRAWING_IDS, drawSymbol } from "./symbol-drawings";

const OUT_DIR = join(process.cwd(), "public", "symbols");
mkdirSync(OUT_DIR, { recursive: true });

const SIZE = 64;
const OPTS = { size: SIZE, color: "#1e293b", stroke: 3.5, pad: 6 };

for (const id of DRAWING_IDS) {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, SIZE, SIZE);
  drawSymbol(ctx, id, OPTS);
  writeFileSync(join(OUT_DIR, `${id}.png`), canvas.toBuffer("image/png"));
  console.log(`Generated ${id}.png`);
}

console.log(`\nDone! Generated ${DRAWING_IDS.length} icons in ${OUT_DIR}`);
