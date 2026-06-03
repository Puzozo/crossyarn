/**
 * Generate 64x64 PNG icons for standard knitting symbols using node-canvas.
 * Run: npx tsx scripts/generate-builtin-pngs.ts
 */

import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const OUT_DIR = join(process.cwd(), "public", "symbols");
mkdirSync(OUT_DIR, { recursive: true });

const SIZE = 64;
const PAD = 6;
const STROKE = 3.5;
const COLOR = "#1e293b";

function draw(id: string, drawFn: (ctx: CanvasRenderingContext2D, size: number) => void) {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, SIZE, SIZE);
  drawFn(ctx, SIZE);
  const buf = canvas.toBuffer("image/png");
  writeFileSync(join(OUT_DIR, `${id}.png`), buf);
  console.log(`Generated ${id}.png`);
}

// 1. knit — vertical line
function drawKnit(ctx: CanvasRenderingContext2D, s: number) {
  ctx.strokeStyle = COLOR;
  ctx.lineWidth = STROKE;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(s / 2, PAD);
  ctx.lineTo(s / 2, s - PAD);
  ctx.stroke();
}

// 2. purl — horizontal line
function drawPurl(ctx: CanvasRenderingContext2D, s: number) {
  ctx.strokeStyle = COLOR;
  ctx.lineWidth = STROKE;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(PAD, s / 2);
  ctx.lineTo(s - PAD, s / 2);
  ctx.stroke();
}

// 3. yarn-over — circle
function drawYarnOver(ctx: CanvasRenderingContext2D, s: number) {
  ctx.strokeStyle = COLOR;
  ctx.lineWidth = STROKE;
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s / 2 - PAD, 0, Math.PI * 2);
  ctx.stroke();
}

// 4. purl-in-yarn-over — circle with bottom half filled
function drawPurlInYarnOver(ctx: CanvasRenderingContext2D, s: number) {
  const r = s / 2 - PAD;
  ctx.strokeStyle = COLOR;
  ctx.lineWidth = STROKE;
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = COLOR + "33";
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, r, 0, Math.PI);
  ctx.lineTo(s / 2 + r, s / 2);
  ctx.fill();
}

// 5. cross-purl — circle with horizontal line
function drawCrossPurl(ctx: CanvasRenderingContext2D, s: number) {
  const r = s / 2 - PAD - 2;
  ctx.strokeStyle = COLOR;
  ctx.lineWidth = STROKE;
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = STROKE - 0.5;
  ctx.beginPath();
  ctx.moveTo(s / 2 - r + 2, s / 2);
  ctx.lineTo(s / 2 + r - 2, s / 2);
  ctx.stroke();
}

// 6. cross-knit — circle with vertical line
function drawCrossKnit(ctx: CanvasRenderingContext2D, s: number) {
  const r = s / 2 - PAD - 2;
  ctx.strokeStyle = COLOR;
  ctx.lineWidth = STROKE;
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = STROKE - 0.5;
  ctx.beginPath();
  ctx.moveTo(s / 2, s / 2 - r + 2);
  ctx.lineTo(s / 2, s / 2 + r - 2);
  ctx.stroke();
}

// 7. k2tog-left — left-pointing chevron
function drawK2togLeft(ctx: CanvasRenderingContext2D, s: number) {
  ctx.strokeStyle = COLOR;
  ctx.lineWidth = STROKE;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(s - PAD, PAD + 4);
  ctx.lineTo(PAD + 4, s / 2);
  ctx.lineTo(s - PAD, s - PAD - 4);
  ctx.stroke();
}

// 8. k2tog-right — right-pointing chevron
function drawK2togRight(ctx: CanvasRenderingContext2D, s: number) {
  ctx.strokeStyle = COLOR;
  ctx.lineWidth = STROKE;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(PAD, PAD + 4);
  ctx.lineTo(s - PAD - 4, s / 2);
  ctx.lineTo(PAD, s - PAD - 4);
  ctx.stroke();
}

// 9. p2tog-left — left-pointing with vertical bar
function drawP2togLeft(ctx: CanvasRenderingContext2D, s: number) {
  ctx.strokeStyle = COLOR;
  ctx.lineWidth = STROKE - 0.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(s - PAD - 4, PAD + 6);
  ctx.lineTo(PAD + 8, s / 2);
  ctx.lineTo(s - PAD - 4, s - PAD - 6);
  ctx.stroke();
  ctx.lineWidth = STROKE - 0.5;
  ctx.beginPath();
  ctx.moveTo(PAD + 2, PAD + 4);
  ctx.lineTo(PAD + 2, s - PAD - 4);
  ctx.stroke();
}

// 10. p2tog-right — right-pointing with vertical bar
function drawP2togRight(ctx: CanvasRenderingContext2D, s: number) {
  ctx.strokeStyle = COLOR;
  ctx.lineWidth = STROKE - 0.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(PAD + 4, PAD + 6);
  ctx.lineTo(s - PAD - 8, s / 2);
  ctx.lineTo(PAD + 4, s - PAD - 6);
  ctx.stroke();
  ctx.lineWidth = STROKE - 0.5;
  ctx.beginPath();
  ctx.moveTo(s - PAD - 2, PAD + 4);
  ctx.lineTo(s - PAD - 2, s - PAD - 4);
  ctx.stroke();
}

// 11. k3tog — upward triangle
function drawK3tog(ctx: CanvasRenderingContext2D, s: number) {
  ctx.strokeStyle = COLOR;
  ctx.lineWidth = STROKE;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(s / 2, PAD + 2);
  ctx.lineTo(PAD + 2, s - PAD);
  ctx.lineTo(s - PAD - 2, s - PAD);
  ctx.closePath();
  ctx.stroke();
}

// 12. p3tog — downward triangle
function drawP3tog(ctx: CanvasRenderingContext2D, s: number) {
  ctx.strokeStyle = COLOR;
  ctx.lineWidth = STROKE;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(s / 2, s - PAD - 2);
  ctx.lineTo(PAD + 2, PAD + 2);
  ctx.lineTo(s - PAD - 2, PAD + 2);
  ctx.closePath();
  ctx.stroke();
}

// 13. slip-back — filled left triangle
function drawSlipBack(ctx: CanvasRenderingContext2D, s: number) {
  ctx.fillStyle = COLOR + "B3";
  ctx.beginPath();
  ctx.moveTo(PAD + 2, s / 2);
  ctx.lineTo(s - PAD - 2, PAD + 4);
  ctx.lineTo(s - PAD - 2, s - PAD - 4);
  ctx.closePath();
  ctx.fill();
}

// 14. slip-front — downward triangle outline with vertical line
function drawSlipFront(ctx: CanvasRenderingContext2D, s: number) {
  ctx.strokeStyle = COLOR;
  ctx.lineWidth = STROKE;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(s / 2, s - PAD - 2);
  ctx.lineTo(PAD + 4, PAD + 4);
  ctx.lineTo(s - PAD - 4, PAD + 4);
  ctx.closePath();
  ctx.stroke();
  ctx.lineWidth = STROKE - 1;
  ctx.beginPath();
  ctx.moveTo(s / 2, PAD + 4);
  ctx.lineTo(s / 2, s - PAD - 2);
  ctx.stroke();
}

// 15. two-from-one — "2/" text
function drawTextIcon(ctx: CanvasRenderingContext2D, s: number, text: string) {
  ctx.fillStyle = COLOR;
  ctx.font = `bold ${Math.floor(s * 0.45)}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, s / 2, s / 2 + 2);
}

// 16. three-from-one
// 17. four-from-one
// 18. four-together
// 19. five-from-one
// 20. five-together

// 21. five-knit — five vertical lines
function drawFiveKnit(ctx: CanvasRenderingContext2D, s: number) {
  ctx.strokeStyle = COLOR;
  ctx.lineWidth = STROKE - 0.5;
  ctx.lineCap = "round";
  const gap = (s - PAD * 2) / 4;
  for (let i = 0; i < 5; i++) {
    const x = PAD + gap * i;
    ctx.beginPath();
    ctx.moveTo(x, PAD);
    ctx.lineTo(x, s - PAD);
    ctx.stroke();
  }
}

// 22. wrap — X cross
function drawWrap(ctx: CanvasRenderingContext2D, s: number) {
  ctx.strokeStyle = COLOR;
  ctx.lineWidth = STROKE;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(PAD + 4, PAD + 4);
  ctx.lineTo(s - PAD - 4, s - PAD - 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(s - PAD - 4, PAD + 4);
  ctx.lineTo(PAD + 4, s - PAD - 4);
  ctx.stroke();
}

// 23. bobble — filled circle
function drawBobble(ctx: CanvasRenderingContext2D, s: number) {
  ctx.fillStyle = COLOR;
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s / 2 - PAD - 2, 0, Math.PI * 2);
  ctx.fill();
}

// 24. empty — small dot
function drawEmpty(ctx: CanvasRenderingContext2D, s: number) {
  ctx.fillStyle = "#94a3b8";
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, 4, 0, Math.PI * 2);
  ctx.fill();
}

// Generate all icons
const icons: Array<{ id: string; fn: (ctx: CanvasRenderingContext2D, s: number) => void }> = [
  { id: "knit", fn: drawKnit },
  { id: "purl", fn: drawPurl },
  { id: "yarn-over", fn: drawYarnOver },
  { id: "purl-in-yarn-over", fn: drawPurlInYarnOver },
  { id: "cross-purl", fn: drawCrossPurl },
  { id: "cross-knit", fn: drawCrossKnit },
  { id: "k2tog-left", fn: drawK2togLeft },
  { id: "k2tog-right", fn: drawK2togRight },
  { id: "p2tog-left", fn: drawP2togLeft },
  { id: "p2tog-right", fn: drawP2togRight },
  { id: "k3tog", fn: drawK3tog },
  { id: "p3tog", fn: drawP3tog },
  { id: "slip-back", fn: drawSlipBack },
  { id: "slip-front", fn: drawSlipFront },
  { id: "two-from-one", fn: (ctx, s) => drawTextIcon(ctx, s, "2/") },
  { id: "three-from-one", fn: (ctx, s) => drawTextIcon(ctx, s, "3/") },
  { id: "four-from-one", fn: (ctx, s) => drawTextIcon(ctx, s, "4/") },
  { id: "four-together", fn: (ctx, s) => drawTextIcon(ctx, s, "4\\") },
  { id: "five-from-one", fn: (ctx, s) => drawTextIcon(ctx, s, "5/") },
  { id: "five-together", fn: (ctx, s) => drawTextIcon(ctx, s, "5\\") },
  { id: "five-knit", fn: drawFiveKnit },
  { id: "wrap", fn: drawWrap },
  { id: "bobble", fn: drawBobble },
  { id: "empty", fn: drawEmpty }
];

for (const { id, fn } of icons) {
  draw(id, fn);
}

console.log(`\nDone! Generated ${icons.length} icons in ${OUT_DIR}`);
