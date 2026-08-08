import { DEFAULT_PALETTE, DEFAULT_SYMBOLS } from "@/lib/patterns/model";
import {
  CONFIDENCE_THRESHOLD,
  IMPORT_STAGES,
  ImportCell,
  ImportGlyph,
  ImportResult
} from "@/lib/import-pipeline/contracts";

/**
 * Mock recognition engine.
 *
 * This produces a plausible {@link ImportResult} WITHOUT any computer vision, so the
 * entire web flow (upload → queue → preview → correct → save) works end-to-end before
 * the Python service exists. Swapping to the real engine is a single integration point:
 * when IMPORT_PYTHON_URL is set, the queue calls the Python service instead of this.
 *
 * It deliberately emits a few low-confidence cells and one or two "Unknown" glyphs so
 * the review UI (confidence highlighting, legend remap, Unknown rename) is exercised.
 */

// Small deterministic PRNG so re-detecting the same job is stable.
function makeRng(seedStr: string) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function unknownGlyphImage(label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="#fff7ed"/><rect x="3" y="3" width="58" height="58" fill="none" stroke="#d97706" stroke-width="2" stroke-dasharray="4 3"/><text x="32" y="42" font-family="serif" font-size="34" font-weight="700" text-anchor="middle" fill="#b45309">${label}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export type RecognizeOptions = {
  seed: string;
  width?: number;
  height?: number;
};

export function recognizeMock({ seed, width, height }: RecognizeOptions): ImportResult {
  const rng = makeRng(seed);
  const w = Math.max(1, Math.min(200, width ?? 8 + Math.floor(rng() * 12)));
  const h = Math.max(1, Math.min(200, height ?? 8 + Math.floor(rng() * 12)));

  const defaultColor = DEFAULT_PALETTE[0].hex;

  // Build a glyph dictionary: a handful of known symbols + 1–2 unknown glyphs.
  const knownPool = DEFAULT_SYMBOLS.filter((s) => s.id !== "empty" && (s.width ?? 1) === 1).slice(0, 8);
  const glyphs: Record<string, ImportGlyph> = {};

  // "empty" is always present so blank cells have something to reference.
  glyphs["empty"] = {
    hash: "empty",
    image: DEFAULT_SYMBOLS.find((s) => s.id === "empty")?.imageData ?? "",
    mappedSymbolId: "empty",
    suggestedName: "Порожньо",
    width: 1,
    height: 1,
    occurrences: 0
  };

  const knownHashes: string[] = [];
  for (const sym of knownPool) {
    const hash = `k_${sym.id}`;
    glyphs[hash] = {
      hash,
      image: sym.imageData ?? "",
      mappedSymbolId: sym.id,
      description: sym.description,
      suggestedName: sym.label,
      width: 1,
      height: 1,
      occurrences: 0
    };
    knownHashes.push(hash);
  }

  const unknownCount = 1 + Math.floor(rng() * 2); // 1 or 2
  const unknownHashes: string[] = [];
  for (let i = 0; i < unknownCount; i++) {
    const name = `Unknown${i + 1}`;
    const hash = `u_${i + 1}`;
    glyphs[hash] = {
      hash,
      image: unknownGlyphImage(String(i + 1)),
      mappedSymbolId: null,
      description: undefined,
      suggestedName: name,
      width: 1,
      height: 1,
      occurrences: 0
    };
    unknownHashes.push(hash);
  }

  const pickPool = [...knownHashes, ...unknownHashes];

  const cells: ImportCell[][] = [];
  let lowConfidenceCount = 0;
  for (let r = 0; r < h; r++) {
    const row: ImportCell[] = [];
    for (let c = 0; c < w; c++) {
      // ~35% empty, rest a glyph from the pool.
      let hash: string;
      if (rng() < 0.35) {
        hash = "empty";
      } else {
        hash = pickPool[Math.floor(rng() * pickPool.length)];
      }
      // Unknown glyphs and ~12% of others come back low-confidence.
      const isUnknown = hash.startsWith("u_");
      const confidence = isUnknown
        ? 0.3 + rng() * 0.3
        : rng() < 0.12
          ? 0.4 + rng() * 0.25
          : 0.85 + rng() * 0.15;
      if (hash !== "empty" && confidence < CONFIDENCE_THRESHOLD) lowConfidenceCount++;
      glyphs[hash].occurrences++;
      row.push({ hash, color: defaultColor, confidence: Number(confidence.toFixed(2)) });
    }
    cells.push(row);
  }

  // Demonstrate a multi-cell symbol: drop one cable-4 (width 4) into row 0 so the
  // occupiedByAnchor path is exercised end-to-end (preview span + save + editor).
  const cable = DEFAULT_SYMBOLS.find((s) => s.id === "cable-4");
  if (cable && w >= 4) {
    glyphs["k_cable-4"] = {
      hash: "k_cable-4",
      image: cable.imageData ?? "",
      mappedSymbolId: "cable-4",
      description: cable.description,
      suggestedName: cable.label,
      width: 4,
      height: 1,
      occurrences: 1
    };
    cells[0][0] = { hash: "k_cable-4", color: defaultColor, confidence: 0.95 };
    for (let c = 1; c < 4; c++) {
      cells[0][c] = { hash: "empty", color: defaultColor, confidence: 1, occupiedByAnchor: [0, 0] };
    }
  }

  return {
    stages: IMPORT_STAGES,
    suggestedTitle: "Імпортована схема",
    grid: { width: w, height: h },
    cells,
    glyphs,
    palette: DEFAULT_PALETTE.map((p) => p.hex),
    legendDetected: rng() > 0.3,
    deskewFailed: false,
    lowConfidenceCount,
    confidenceThreshold: CONFIDENCE_THRESHOLD
  };
}
