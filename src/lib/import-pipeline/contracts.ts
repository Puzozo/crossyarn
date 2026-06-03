import { PatternDocument } from "@/lib/patterns/model";

export type PatternImportStage =
  | "uploaded"
  | "preprocessed"
  | "grid-detected"
  | "segmented"
  | "converted"
  | "ready";

export type PatternImportPreview = {
  stages: PatternImportStage[];
  suggestedTitle: string;
  pattern: PatternDocument;
};