import { PatternDocument } from "@/lib/patterns/model";

export type PatternImportStage =
  | "uploaded"
  | "preprocessed"
  | "grid-detected"
  | "segmented"
  | "converted"
  | "ready";

export const IMPORT_STAGES: PatternImportStage[] = [
  "uploaded",
  "preprocessed",
  "grid-detected",
  "segmented",
  "converted",
  "ready"
];

/** Confidence below which a cell is flagged for manual review in the preview UI. */
export const CONFIDENCE_THRESHOLD = 0.7;

/** Soft cap on distinct Unknown glyphs a single import may emit (anti-clutter guard). */
export const MAX_UNKNOWN_GLYPHS = 50;

/**
 * One recognized cell. `hash` references an entry in `ImportResult.glyphs`.
 * The concrete symbol shown is resolved at render time through the glyph map,
 * unless `overrideSymbolId` was set by a manual per-cell correction.
 */
export type ImportCell = {
  hash: string;
  color: string;
  confidence: number;
  /** Manual single-cell correction (low-confidence fix); wins over the glyph mapping. */
  overrideSymbolId?: string;
  /** Multi-cell symbol bookkeeping, in the same shape as PatternCell. */
  occupiedByAnchor?: [number, number];
};

/**
 * A distinct glyph found in the chart (deduplicated by perceptual hash).
 * `mappedSymbolId` is our standard symbol it was matched to, or null when unknown.
 */
export type ImportGlyph = {
  hash: string;
  /** Cropped glyph image as a data URI (shown in the legend / unknown panels). */
  image: string;
  /** Matched standard symbol id, or null when this glyph is unknown. */
  mappedSymbolId: string | null;
  /** OCR'd legend description, when a legend was present. */
  description?: string;
  /** Default name for an unknown glyph ("Unknown1", "Unknown2", …). */
  suggestedName: string;
  width: number;
  height: number;
  occurrences: number;
};

export type ImportResult = {
  stages: PatternImportStage[];
  suggestedTitle: string;
  grid: { width: number; height: number };
  cells: ImportCell[][];
  /** Glyph dictionary keyed by hash; the legend/unknown panels edit this. */
  glyphs: Record<string, ImportGlyph>;
  /** Detected colour palette (hex) for jacquard charts; empty for symbolic charts. */
  palette?: string[];
  legendDetected: boolean;
  /** Set when perspective/deskew correction is needed (photo input). */
  deskewFailed?: boolean;
  lowConfidenceCount: number;
  confidenceThreshold: number;
};

/** Reasons a job can land in FAILED, surfaced to the UI for tailored messaging. */
export type ImportErrorType =
  | "grid-detection-failed"
  | "timeout"
  | "service-unavailable"
  | "invalid-image"
  | "internal-error";

/** Legacy preview shape kept for any older callers; superseded by ImportResult. */
export type PatternImportPreview = {
  stages: PatternImportStage[];
  suggestedTitle: string;
  pattern: PatternDocument;
};
