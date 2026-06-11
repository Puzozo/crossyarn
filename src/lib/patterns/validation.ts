import { z } from "zod";

export const patternCellSchema = z.object({
  symbolId: z.string().min(1),
  color: z.string().min(1),
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
      hex: z.string().min(1)
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

export const createPatternSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(500).optional().or(z.literal("")),
  width: z.number().int().min(1).max(200),
  height: z.number().int().min(1).max(200),
  patternData: patternDocumentSchema
});

export const updatePatternSchema = createPatternSchema.extend({
  id: z.string().min(1)
});