import { PatternDocument } from "@/lib/patterns/model";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const WHITE = new Set(["#fff", "#ffffff", "white", "transparent", ""]);

function isBackground(color: string | undefined): boolean {
  return !color || WHITE.has(color.trim().toLowerCase());
}

/**
 * Element budget: an <img>-sized preview never needs more detail than this,
 * and it bounds the response size for adversarially large grids (200×200 = 40k
 * cells would otherwise emit a multi-MB SVG).
 */
const MAX_ELEMENTS = 8000;

/**
 * Compact grid-only SVG preview for catalog/profile cards: color runs are
 * RLE-merged per row and symbols are drawn as text glyphs — never as the
 * base64 <image> icons the full export embeds (those are per-cell and huge).
 * No title, no row/column numbers, no legend.
 *
 * Approximations are deliberate: in skipPurlRows mode symbols anchored in a
 * hidden row are simply dropped (the full export projects them), and past the
 * element budget the grid is downsampled to color blocks without glyphs.
 */
export function patternToThumbnailSvg(pattern: PatternDocument): string {
  const skipPurl = pattern.view.skipPurlRows ?? false;
  const visibleRowIndexes = Array.from({ length: pattern.height }, (_, i) => i)
    .filter((i) => !skipPurl || (pattern.height - i) % 2 === 1);

  const width = pattern.width;
  const visibleHeight = visibleRowIndexes.length;
  const symbolById = new Map(pattern.symbols.map((s) => [s.id, s]));

  // Pass 1: RLE color rects (one per same-color horizontal run, background skipped)
  const rects: string[] = [];
  visibleRowIndexes.forEach((rowIndex, displayIdx) => {
    const row = pattern.cells[rowIndex] ?? [];
    let runStart = 0;
    let runColor: string | null = null;
    const flush = (end: number) => {
      if (runColor !== null && !isBackground(runColor)) {
        rects.push(
          `<rect x="${runStart}" y="${displayIdx}" width="${end - runStart}" height="1" fill="${escapeXml(runColor)}"/>`
        );
      }
    };
    for (let col = 0; col < width; col++) {
      const color = (row[col]?.color ?? "").trim().toLowerCase();
      if (color !== runColor) {
        flush(col);
        runStart = col;
        runColor = color;
      }
    }
    flush(width);
  });

  // Pass 2: glyphs for symbol cells (anchors only; occupied cells are covered)
  const texts: string[] = [];
  visibleRowIndexes.forEach((rowIndex, displayIdx) => {
    const row = pattern.cells[rowIndex] ?? [];
    for (let col = 0; col < width; col++) {
      const cell = row[col];
      if (!cell || cell.occupiedByAnchor || cell.symbolId === "empty") continue;
      const symbol = symbolById.get(cell.symbolId);
      const glyph = symbol?.glyph ?? "·";
      const span = Math.min(symbol?.width ?? 1, width - col);
      texts.push(
        `<text x="${col + span / 2}" y="${displayIdx + 0.78}" text-anchor="middle" font-size="0.8" font-family="sans-serif" fill="#1f2937">${escapeXml(glyph)}</text>`
      );
    }
  });

  let body: string;
  if (rects.length + texts.length <= MAX_ELEMENTS) {
    body = rects.join("") + texts.join("");
  } else {
    // Downsample: k×k blocks sampled at the top-left cell. Symbol-only charts
    // (all-white lace) get a neutral gray so the texture doesn't vanish.
    let stride = 2;
    while (Math.ceil(width / stride) * Math.ceil(visibleHeight / stride) > MAX_ELEMENTS) stride++;
    const blocks: string[] = [];
    for (let dy = 0; dy < visibleHeight; dy += stride) {
      const row = pattern.cells[visibleRowIndexes[dy]] ?? [];
      for (let col = 0; col < width; col += stride) {
        const cell = row[col];
        if (!cell) continue;
        const color = (cell.color ?? "").trim().toLowerCase();
        const hasSymbol = !cell.occupiedByAnchor && cell.symbolId !== "empty";
        const fill = !isBackground(color) ? color : hasSymbol ? "#cbd5e1" : null;
        if (!fill) continue;
        blocks.push(
          `<rect x="${col}" y="${dy}" width="${stride}" height="${stride}" fill="${escapeXml(fill)}"/>`
        );
      }
    }
    body = blocks.join("");
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width * 10}" height="${visibleHeight * 10}" ` +
    `viewBox="0 0 ${width} ${visibleHeight}" shape-rendering="crispEdges">` +
    `<rect width="100%" height="100%" fill="#ffffff"/>` +
    body +
    `</svg>`
  );
}
