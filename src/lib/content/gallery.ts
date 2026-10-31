import { z } from "zod";

const galleryItemSchema = z
  .object({
    assetId: z.string().min(1).max(200),
    alt: z.string().min(1).max(300),
    caption: z.string().max(300).optional()
  })
  .strict();

export const gallerySchema = z.array(galleryItemSchema).max(30);

export type GalleryItem = z.infer<typeof galleryItemSchema>;
