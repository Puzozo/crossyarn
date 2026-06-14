import { z } from "zod";

// Colors only ever come from the palette / color picker, i.e. hex (#rgb / #rrggbb / #rrggbbaa).
// Constraining the format here is defense-in-depth against markup injection in the SVG export.
const hexColor = z.string().regex(/^#[0-9a-fA-F]{3,8}$/);

export const patternCellSchema = z.object({
  symbolId: z.string().min(1),
  color: hexColor,
  occupiedByAnchor: z.tuple([z.number(), z.number()]).optional()
});

export const patternDocumentSchema = z.object({
  version: z.literal(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  cells: z.array(z.array(patternCellSchema)),
  symbols: z.array(
    z.object({
      id: z.string().min(1),
      label: z.string().min(1),
      glyph: z.string().min(1).optional(),
      imageData: z.string().min(1).optional(),
      description: z.string().optional(),
      source: z.enum(["builtin", "user"]).optional(),
      width: z.number().int().min(1).max(6).optional(),
      height: z.number().int().min(1).max(6).optional()
    })
  ),
  palette: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      hex: hexColor
    })
  ),
  view: z.object({
    showGrid: z.boolean(),
    showRowNumbers: z.boolean(),
    showColumnNumbers: z.boolean(),
    skipPurlRows: z.boolean().optional()
  }),
  rapports: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        cells: z.array(z.array(patternCellSchema))
      })
    )
    .optional()
});

const trimmedTitle = z.string().trim().min(2).max(120);

export const createPatternSchema = z.object({
  title: trimmedTitle,
  description: z.string().max(500).optional().or(z.literal("")),
  width: z.number().int().min(1).max(200),
  height: z.number().int().min(1).max(200),
  patternData: patternDocumentSchema
});

export const updatePatternSchema = createPatternSchema.extend({
  id: z.string().min(1)
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