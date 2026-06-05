import { BUILTIN_ICONS } from "@/lib/patterns/builtin-icons";

export type PatternCell = {
  symbolId: string;
  color: string;
  /** If set, this cell is occupied by a multi-cell symbol anchored at [row, col] */
  occupiedByAnchor?: [number, number];
};

export type PatternSymbol = {
  id: string;
  label: string;
  glyph?: string;
  imageData?: string;
  description?: string;
  source?: "builtin" | "user";
  /** Number of grid cells this symbol spans horizontally (default 1) */
  width?: number;
  /** Number of grid cells this symbol spans vertically (default 1) */
  height?: number;
};

export type PatternPaletteColor = {
  id: string;
  name: string;
  hex: string;
};

export type PatternGrid = PatternCell[][];

export type PatternDocument = {
  version: 1;
  width: number;
  height: number;
  cells: PatternGrid;
  symbols: PatternSymbol[];
  palette: PatternPaletteColor[];
  view: {
    showGrid: boolean;
    showRowNumbers: boolean;
    showColumnNumbers: boolean;
  };
};

export const DEFAULT_SYMBOLS: PatternSymbol[] = [
  { id: "knit", label: "Лицьова петля", glyph: "|", imageData: BUILTIN_ICONS.knit, description: "Лицьова петля", source: "builtin" },
  { id: "purl", label: "Виворітна петля", glyph: "\u2014", imageData: BUILTIN_ICONS.purl, description: "Виворітна петля", source: "builtin" },
  { id: "yarn-over", label: "Накид", glyph: "\u25CB", imageData: BUILTIN_ICONS["yarn-over"], description: "Накид", source: "builtin" },
  { id: "purl-in-yarn-over", label: "Накид пров. вивор.", glyph: "\u25D4", imageData: BUILTIN_ICONS["purl-in-yarn-over"], description: "Накид, в вивор. ряду пров'язати лицьовою", source: "builtin" },
  { id: "cross-purl", label: "Вивор. схрещена", glyph: "\u2A02", imageData: BUILTIN_ICONS["cross-purl"], description: "Виворітна схрещена", source: "builtin" },
  { id: "cross-knit", label: "Лиц. схрещена", glyph: "\u2297", imageData: BUILTIN_ICONS["cross-knit"], description: "Лицьова схрещена", source: "builtin" },
  { id: "k2tog-left", label: "2 лиц. вліво", glyph: "\u3008", imageData: BUILTIN_ICONS["k2tog-left"], description: "2 п. разом лицьовою з нахилом вліво", source: "builtin" },
  { id: "k2tog-right", label: "2 лиц. вправо", glyph: "\u3009", imageData: BUILTIN_ICONS["k2tog-right"], description: "2 п. разом лицьовою з нахилом вправо", source: "builtin" },
  { id: "p2tog-left", label: "2 вивор. вліво", glyph: "\u22CF", imageData: BUILTIN_ICONS["p2tog-left"], description: "2 п. разом виворітною з нахилом вліво", source: "builtin" },
  { id: "p2tog-right", label: "2 вивор. вправо", glyph: "\u22CE", imageData: BUILTIN_ICONS["p2tog-right"], description: "2 п. разом виворітною з нахилом вправо", source: "builtin" },
  { id: "k3tog", label: "3 разом лиц.", glyph: "\u22C0", imageData: BUILTIN_ICONS.k3tog, description: "3 п. разом лицьовою", source: "builtin" },
  { id: "p3tog", label: "3 разом вивор.", glyph: "\u27C1", imageData: BUILTIN_ICONS.p3tog, description: "3 п. разом виворітною", source: "builtin" },
  { id: "slip-back", label: "Знята, нитка ззаду", glyph: "\u25C1", imageData: BUILTIN_ICONS["slip-back"], description: "Знята петля, нитка за роботою", source: "builtin" },
  { id: "slip-front", label: "Знята, нитка спереду", glyph: "\u25BD", imageData: BUILTIN_ICONS["slip-front"], description: "Знята петля, нитка перед роботою", source: "builtin" },
  { id: "two-from-one", label: "2 з однієї", glyph: "2/", imageData: BUILTIN_ICONS["two-from-one"], description: "2 петлі з однієї", source: "builtin" },
  { id: "three-from-one", label: "3 з однієї", glyph: "3/", imageData: BUILTIN_ICONS["three-from-one"], description: "3 петлі з однієї", source: "builtin" },
  { id: "four-from-one", label: "4 з однієї", glyph: "4/", imageData: BUILTIN_ICONS["four-from-one"], description: "4 петлі з однієї", source: "builtin" },
  { id: "four-together", label: "4 разом", glyph: "4\\", imageData: BUILTIN_ICONS["four-together"], description: "4 петлі разом", source: "builtin" },
  { id: "five-from-one", label: "5 з однієї", glyph: "5/", imageData: BUILTIN_ICONS["five-from-one"], description: "5 петель з однієї", source: "builtin" },
  { id: "five-together", label: "5 разом", glyph: "5\\", imageData: BUILTIN_ICONS["five-together"], description: "5 петель разом", source: "builtin" },
  { id: "five-knit", label: "5 лицьових", glyph: "|||||", imageData: BUILTIN_ICONS["five-knit"], description: "5 лицьових", source: "builtin" },
  { id: "wrap", label: "Платочна в'язка", glyph: "\u2715", imageData: BUILTIN_ICONS.wrap, description: "1 п. платочної в'язки", source: "builtin" },
  { id: "bobble", label: "Шишка", glyph: "\u25CF", imageData: BUILTIN_ICONS.bobble, description: "Шишка", source: "builtin" },
  { id: "empty", label: "Порожньо", glyph: "\u00B7", imageData: BUILTIN_ICONS.empty, description: "Порожня клітинка", source: "builtin" },
  { id: "k3tog-wide", label: "3 разом лиц. (шир.)", glyph: "\u22C0", imageData: BUILTIN_ICONS["k3tog-wide"], description: "3 п. разом лицьовою — широкий варіант", source: "builtin", width: 3 },
  { id: "p3tog-wide", label: "3 разом вивор. (шир.)", glyph: "\u27C1", imageData: BUILTIN_ICONS["p3tog-wide"], description: "3 п. разом виворітною — широкий варіант", source: "builtin", width: 3 },
  { id: "cable-4", label: "Коса 4", glyph: "\u2658", imageData: BUILTIN_ICONS["cable-4"], description: "Перехрещення 4-х петель", source: "builtin", width: 4 },
  { id: "cable-6", label: "Коса 6", glyph: "\u2659", imageData: BUILTIN_ICONS["cable-6"], description: "Перехрещення 6-ти петель", source: "builtin", width: 6 }
];

export const DEFAULT_PALETTE: PatternPaletteColor[] = [
  { id: "cream", name: "Cream", hex: "#f5ede1" },
  { id: "rose", name: "Rose", hex: "#d67c8f" },
  { id: "forest", name: "Forest", hex: "#4f7c6d" },
  { id: "charcoal", name: "Charcoal", hex: "#2f3542" }
];

export function createEmptyPattern(width = 24, height = 24): PatternDocument {
  return {
    version: 1,
    width,
    height,
    cells: Array.from({ length: height }, () =>
      Array.from({ length: width }, () => ({
        symbolId: "empty",
        color: DEFAULT_PALETTE[0].hex
      }))
    ),
    symbols: DEFAULT_SYMBOLS,
    palette: DEFAULT_PALETTE,
    view: {
      showGrid: true,
      showRowNumbers: true,
      showColumnNumbers: true
    }
  };
}
