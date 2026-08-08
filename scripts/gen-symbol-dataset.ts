/**
 * Synthetic training-data generator for the image-import recognizer.
 *
 * Why synthetic (not scraped charts): we own the 28 canonical symbols, so we can
 * render UNLIMITED, perfectly-labelled, class-balanced samples with controlled
 * augmentation — legal, and far more than hand-labelling ~100 copyrighted charts
 * could ever give. Anything that doesn't look like our symbols becomes "Unknown"
 * at inference by design, so the classifier only needs to know OUR classes well.
 *
 * Produces two things under --out (default ./python-service/dataset):
 *   1. classifier/<symbolId>/NNNN.png  — augmented single-cell crops (folder = label).
 *      Directly consumable by torchvision ImageFolder / tf.keras image_dataset.
 *   2. charts/chart_NN.png + chart_NN.json — full synthetic charts with per-cell
 *      ground truth, for grid-detection + end-to-end evaluation.
 *
 * Run:
 *   npx tsx scripts/gen-symbol-dataset.ts --per-class 800 --charts 40
 *   (sample: npx tsx scripts/gen-symbol-dataset.ts --per-class 12 --charts 4)
 */
import { createCanvas, loadImage, type CanvasRenderingContext2D } from "canvas";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { DRAWING_IDS, drawSymbol } from "./symbol-drawings";
import { BUILTIN_ICONS } from "../src/lib/patterns/builtin-icons";

// Multi-cell symbols and their widths (rendered from the real builtin icons).
const WIDE_SYMBOLS = [
  { id: "cable-4", w: 4 },
  { id: "cable-6", w: 6 },
  { id: "k3tog-wide", w: 3 },
  { id: "p3tog-wide", w: 3 }
];

// ── CLI args ─────────────────────────────────────────────────────────────────
function arg(name: string, def: number): number {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1]) return Number(process.argv[i + 1]);
  return def;
}
function argStr(name: string, def: string): string {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  return def;
}

const PER_CLASS = arg("per-class", 12);
const CHARTS = arg("charts", 4);
const COLOR_CHARTS = arg("color-charts", 0);
const WIDE_PER = arg("wide", 0);
const WIDE_CHARTS = arg("wide-charts", 0);
const TILE = arg("size", 48);
const WCELL = 40; // px per cell for wide-symbol crops
const OUT = join(process.cwd(), argStr("out", "python-service/dataset"));

const COLOR_POOL = [
  "#c0392b", "#2980b9", "#27ae60", "#f1c40f", "#8e44ad",
  "#e67e22", "#16a085", "#2c3e50", "#d35400", "#1abc9c"
];

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Paper / scan-ish backgrounds and near-black inks for realistic variation.
const PAPER = ["#ffffff", "#fbf7ef", "#f4f1ea", "#eef0f2", "#f7f3ec", "#ffffff"];
const INK = ["#1e293b", "#101418", "#27313f", "#2b2b2b", "#1b2430", "#0f172a"];

function addNoise(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() * 2 - 1) * amount;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);
}

/** Render one augmented cell crop for `id`. */
function renderCell(id: string): Buffer {
  const canvas = createCanvas(TILE, TILE);
  const ctx = canvas.getContext("2d");

  // background
  ctx.fillStyle = pick(PAPER);
  ctx.fillRect(0, 0, TILE, TILE);

  // sometimes a faint cell border (chart grid line)
  if (Math.random() < 0.6) {
    ctx.strokeStyle = "rgba(120,120,120," + rnd(0.15, 0.4).toFixed(2) + ")";
    ctx.lineWidth = rnd(0.6, 1.4);
    ctx.strokeRect(0.5, 0.5, TILE - 1, TILE - 1);
  }

  // optional light blur (node-canvas supports ctx.filter when built with it)
  try {
    if (Math.random() < 0.3) ctx.filter = `blur(${rnd(0.3, 0.9).toFixed(2)}px)`;
  } catch {
    /* filter unsupported — skip */
  }

  // jittered transform around the centre
  const sc = rnd(0.82, 1.12);
  const deg = rnd(-9, 9);
  const dx = rnd(-3, 3);
  const dy = rnd(-3, 3);
  ctx.save();
  ctx.translate(TILE / 2 + dx, TILE / 2 + dy);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.scale(sc, sc);
  ctx.translate(-TILE / 2, -TILE / 2);
  drawSymbol(ctx, id, {
    size: TILE,
    color: pick(INK),
    stroke: rnd(2.4, 4.2),
    pad: rnd(5, 8)
  });
  ctx.restore();

  ctx.filter = "none";
  addNoise(ctx, TILE, TILE, rnd(4, 16));
  return canvas.toBuffer("image/png");
}

function genClassifier() {
  let total = 0;
  for (const id of DRAWING_IDS) {
    const dir = join(OUT, "classifier", id);
    mkdirSync(dir, { recursive: true });
    for (let i = 0; i < PER_CLASS; i++) {
      writeFileSync(join(dir, `${String(i).padStart(4, "0")}.png`), renderCell(id));
      total++;
    }
  }
  console.log(`classifier: ${total} crops across ${DRAWING_IDS.length} classes → ${join(OUT, "classifier")}`);
}

function genCharts() {
  const dir = join(OUT, "charts");
  mkdirSync(dir, { recursive: true });
  const symbolIds = DRAWING_IDS.filter((id) => id !== "empty");

  for (let n = 0; n < CHARTS; n++) {
    const W = Math.floor(rnd(8, 20));
    const H = Math.floor(rnd(8, 20));
    const cell = Math.floor(rnd(22, 30));
    const margin = 12;
    const w = W * cell + margin * 2;
    const h = H * cell + margin * 2;
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = pick(PAPER);
    ctx.fillRect(0, 0, w, h);

    const cells: string[][] = [];
    for (let r = 0; r < H; r++) {
      const row: string[] = [];
      for (let c = 0; c < W; c++) {
        const x = margin + c * cell;
        const y = margin + r * cell;
        // grid line
        ctx.strokeStyle = "rgba(90,90,90,0.5)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cell, cell);
        // content
        const id = Math.random() < 0.4 ? "empty" : pick(symbolIds);
        row.push(id);
        if (id !== "empty") {
          ctx.save();
          ctx.translate(x, y);
          drawSymbol(ctx, id, { size: cell, color: pick(INK), stroke: rnd(2, 3), pad: rnd(3, 5) });
          ctx.restore();
        }
      }
      cells.push(row);
    }
    addNoise(ctx, w, h, rnd(3, 10));

    const base = `chart_${String(n).padStart(2, "0")}`;
    writeFileSync(join(dir, `${base}.png`), canvas.toBuffer("image/png"));
    writeFileSync(
      join(dir, `${base}.json`),
      JSON.stringify({ width: W, height: H, cellPx: cell, margin, cells }, null, 0)
    );
  }
  console.log(`charts: ${CHARTS} charts + ground-truth JSON → ${dir}`);
}

function genColorCharts() {
  const dir = join(OUT, "charts-color");
  mkdirSync(dir, { recursive: true });
  for (let n = 0; n < COLOR_CHARTS; n++) {
    const W = Math.floor(rnd(8, 18));
    const H = Math.floor(rnd(8, 18));
    const cell = Math.floor(rnd(20, 28));
    const margin = 12;
    const w = W * cell + margin * 2;
    const h = H * cell + margin * 2;
    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    const k = Math.floor(rnd(3, 7));
    const palette = [...COLOR_POOL].sort(() => Math.random() - 0.5).slice(0, k);

    const cells: string[][] = [];
    for (let r = 0; r < H; r++) {
      const row: string[] = [];
      for (let c = 0; c < W; c++) {
        const hex = pick(palette);
        row.push(hex);
        const x = margin + c * cell;
        const y = margin + r * cell;
        ctx.fillStyle = hex;
        ctx.fillRect(x, y, cell, cell);
        ctx.strokeStyle = "rgba(0,0,0,0.25)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cell, cell);
      }
      cells.push(row);
    }
    addNoise(ctx, w, h, rnd(2, 6));

    const base = `color_${String(n).padStart(2, "0")}`;
    writeFileSync(join(dir, `${base}.png`), canvas.toBuffer("image/png"));
    writeFileSync(
      join(dir, `${base}.json`),
      JSON.stringify({ mode: "color", width: W, height: H, cellPx: cell, margin, palette, cells }, null, 0)
    );
  }
  console.log(`color charts: ${COLOR_CHARTS} + ground-truth → ${dir}`);
}

function wideAug(ctx: CanvasRenderingContext2D, w: number, h: number, draw: () => void) {
  ctx.fillStyle = pick(PAPER);
  ctx.fillRect(0, 0, w, h);
  if (Math.random() < 0.6) {
    ctx.strokeStyle = "rgba(120,120,120," + rnd(0.15, 0.4).toFixed(2) + ")";
    ctx.lineWidth = rnd(0.6, 1.4);
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  }
  try {
    if (Math.random() < 0.3) ctx.filter = `blur(${rnd(0.3, 0.9).toFixed(2)}px)`;
  } catch {
    /* no filter */
  }
  ctx.save();
  const sc = rnd(0.86, 1.06);
  ctx.translate(w / 2 + rnd(-3, 3), h / 2 + rnd(-2, 2));
  ctx.rotate((rnd(-4, 4) * Math.PI) / 180);
  ctx.scale(sc, sc);
  ctx.translate(-w / 2, -h / 2);
  draw();
  ctx.restore();
  ctx.filter = "none";
  addNoise(ctx, w, h, rnd(4, 14));
}

/**
 * Wide-symbol classifier dataset: real cable/wide icons rendered W cells wide, plus an
 * "other" negative class (random adjacent single symbols) so the model can REJECT
 * non-cables — this is what lets the pipeline merge thin cables without falsely merging
 * neighbouring single symbols.
 */
async function genWideClassifier() {
  const icons: Record<string, Awaited<ReturnType<typeof loadImage>>> = {};
  for (const { id } of WIDE_SYMBOLS) icons[id] = await loadImage(BUILTIN_ICONS[id]);

  let total = 0;
  for (const { id, w } of WIDE_SYMBOLS) {
    const dir = join(OUT, "wide", id);
    mkdirSync(dir, { recursive: true });
    const W = w * WCELL;
    for (let i = 0; i < WIDE_PER; i++) {
      const cv = createCanvas(W, WCELL);
      const ctx = cv.getContext("2d");
      wideAug(ctx, W, WCELL, () => ctx.drawImage(icons[id], 0, 0, W, WCELL));
      writeFileSync(join(dir, `${String(i).padStart(4, "0")}.png`), cv.toBuffer("image/png"));
      total++;
    }
  }

  // Negative "other" class: random adjacent single symbols at widths 3/4/6.
  const negDir = join(OUT, "wide", "other");
  mkdirSync(negDir, { recursive: true });
  const singles = DRAWING_IDS.filter((id) => id !== "empty");
  for (let i = 0; i < WIDE_PER; i++) {
    const w = pick([3, 4, 6]);
    const W = w * WCELL;
    const cv = createCanvas(W, WCELL);
    const ctx = cv.getContext("2d");
    wideAug(ctx, W, WCELL, () => {
      for (let c = 0; c < w; c++) {
        if (Math.random() < 0.25) continue; // some empty cells
        ctx.save();
        ctx.translate(c * WCELL, 0);
        drawSymbol(ctx, pick(singles), { size: WCELL, color: pick(INK), stroke: rnd(2.4, 4), pad: rnd(5, 8) });
        ctx.restore();
      }
    });
    writeFileSync(join(negDir, `${String(i).padStart(4, "0")}.png`), cv.toBuffer("image/png"));
    total++;
  }
  console.log(`wide classifier: ${total} crops (${WIDE_SYMBOLS.length} cables + other) → ${join(OUT, "wide")}`);
}

/** Clean charts with ONE real cable placed (neighbours left empty) + ground truth, for
 *  validating end-to-end cable NAMING. */
async function genWideCharts() {
  const dir = join(OUT, "charts-wide");
  mkdirSync(dir, { recursive: true });
  const icons: Record<string, Awaited<ReturnType<typeof loadImage>>> = {};
  for (const { id } of WIDE_SYMBOLS) icons[id] = await loadImage(BUILTIN_ICONS[id]);
  const singles = DRAWING_IDS.filter((id) => id !== "empty");

  for (let n = 0; n < WIDE_CHARTS; n++) {
    const wide = pick(WIDE_SYMBOLS);
    const W = Math.max(wide.w + 4, Math.floor(rnd(9, 16)));
    const H = Math.floor(rnd(7, 13));
    const cell = 26;
    const margin = 12;
    const cw = W * cell + margin * 2;
    const chh = H * cell + margin * 2;
    const cv = createCanvas(cw, chh);
    const ctx = cv.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cw, chh);

    const row = Math.floor(rnd(1, H - 1));
    const col = Math.floor(rnd(1, W - wide.w - 1));
    const reserved = new Set<string>(); // cable cells + immediate L/R neighbours
    for (let k = -1; k <= wide.w; k++) reserved.add(`${row},${col + k}`);

    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const x = margin + c * cell;
        const y = margin + r * cell;
        ctx.strokeStyle = "rgba(90,90,90,0.5)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, cell, cell);
        if (reserved.has(`${r},${c}`)) continue;
        if (Math.random() < 0.3) {
          ctx.save();
          ctx.translate(x, y);
          drawSymbol(ctx, pick(singles), { size: cell, color: pick(INK), stroke: 2.4, pad: 4 });
          ctx.restore();
        }
      }
    }
    // Draw the cable spanning its cells.
    ctx.drawImage(icons[wide.id], margin + col * cell, margin + row * cell, wide.w * cell, cell);
    addNoise(ctx, cw, chh, rnd(3, 8));

    const base = `wide_${String(n).padStart(2, "0")}`;
    writeFileSync(join(dir, `${base}.png`), cv.toBuffer("image/png"));
    writeFileSync(
      join(dir, `${base}.json`),
      JSON.stringify({ width: W, height: H, cellPx: cell, margin, wide: { row, col, symbolId: wide.id, w: wide.w } })
    );
  }
  console.log(`wide charts: ${WIDE_CHARTS} + ground-truth → ${dir}`);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  console.log(`Generating dataset → ${OUT} (per-class=${PER_CLASS}, charts=${CHARTS}, color-charts=${COLOR_CHARTS}, wide=${WIDE_PER}, tile=${TILE})`);
  genClassifier();
  genCharts();
  if (COLOR_CHARTS > 0) genColorCharts();
  if (WIDE_PER > 0) await genWideClassifier();
  if (WIDE_CHARTS > 0) await genWideCharts();
  writeFileSync(
    join(OUT, "manifest.json"),
    JSON.stringify(
      { generatedAt: new Date().toISOString(), classes: DRAWING_IDS, perClass: PER_CLASS, charts: CHARTS, tile: TILE },
      null,
      2
    )
  );
  console.log("Done. manifest.json written.");
}

void main();
