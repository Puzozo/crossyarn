import { z } from "zod";

// Colors only ever come from the palette / color picker, i.e. hex (#rgb / #rrggbb / #rrggbbaa).
// Constraining the format here is defense-in-depth against markup injection in the SVG export.
const hexColor = z.string().regex(/^#[0-9a-fA-F]{3,8}$/);

// Upper bounds on every collection/string in a pattern document, so an oversized
// JSON body is rejected instead of exhausting memory during validation.
const MAX_GRID = 200;
const MAX_ID = 200;

export const patternCellSchema = z.object({
  symbolId: z.string().min(1).max(MAX_ID),
  color: hexColor,
  occupiedByAnchor: z.tuple([z.number(), z.number()]).optional()
});

const cellGridSchema = z.array(z.array(patternCellSchema).max(MAX_GRID)).max(MAX_GRID);

export const patternDocumentSchema = z.object({
  version: z.literal(1),
  width: z.number().int().positive().max(MAX_GRID),
  height: z.number().int().positive().max(MAX_GRID),
  cells: cellGridSchema,
  symbols: z
    .array(
      z.object({
        id: z.string().min(1).max(MAX_ID),
        label: z.string().min(1).max(MAX_ID),
        glyph: z.string().min(1).max(50).optional(),
        imageData: z.string().min(1).max(300_000).optional(),
        description: z.string().max(1000).optional(),
        source: z.enum(["builtin", "user"]).optional(),
        width: z.number().int().min(1).max(6).optional(),
        height: z.number().int().min(1).max(6).optional()
      })
    )
    .max(500),
  palette: z
    .array(
      z.object({
        id: z.string().min(1).max(MAX_ID),
        name: z.string().min(1).max(MAX_ID),
        hex: hexColor
      })
    )
    .max(1000),
  view: z.object({
    showGrid: z.boolean(),
    showRowNumbers: z.boolean(),
    showColumnNumbers: z.boolean(),
    skipPurlRows: z.boolean().optional()
  }),
  rapports: z
    .array(
      z.object({
        id: z.string().min(1).max(MAX_ID),
        name: z.string().min(1).max(MAX_ID),
        width: z.number().int().positive().max(MAX_GRID),
        height: z.number().int().positive().max(MAX_GRID),
        cells: cellGridSchema
      })
    )
    .max(100)
    .optional()
});

const trimmedTitle = z.string().trim().min(2).max(120);

export const patternVisibilitySchema = z.enum(["PRIVATE", "UNLISTED", "PUBLIC"]);
export type PatternVisibilityValue = z.infer<typeof patternVisibilitySchema>;

export const createPatternSchema = z.object({
  title: trimmedTitle,
  description: z.string().max(500).optional().or(z.literal("")),
  width: z.number().int().min(1).max(200),
  height: z.number().int().min(1).max(200),
  patternData: patternDocumentSchema
});

export const updatePatternSchema = createPatternSchema.extend({
  id: z.string().min(1),
  visibility: patternVisibilitySchema.optional()
});

/**
 * Body schema for POST /api/patterns. patternData is optional (the create form
 * sends only title/width/height and the server builds an empty grid). Width/height
 * are bounded here so an oversized request can never reach createEmptyPattern and OOM.
 */
export const createPatternRequestSchema = z.object({
  title: trimmedTitle,
  description: z.string().max(500).optional().or(z.literal("")),
  width: z.number().int().min(1).max(200),
  height: z.number().int().min(1).max(200),
  patternData: patternDocumentSchema.optional()
});