import { z } from "zod";

const materialItemSchema = z.string().trim().min(1).max(200);

export const materialsSchema = z
  .object({
    yarn: z.array(materialItemSchema).max(50),
    tools: z.array(materialItemSchema).max(50),
    other: z.array(materialItemSchema).max(50)
  })
  .strict();

export type Materials = z.infer<typeof materialsSchema>;

export const DEFAULT_MATERIALS: Materials = { yarn: [], tools: [], other: [] };
