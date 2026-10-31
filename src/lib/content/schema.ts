import { z } from "zod";
import type { $ZodTypeDiscriminable } from "zod/v4/core";
import type { ContentDoc } from "./types";

export const MAX_CONTENT_BLOCKS = 300;
export const MAX_CONTENT_BYTES = 1_000_000;

const hrefSchema = z
  .string()
  .refine(
    (href) => /^https?:\/\//.test(href) || (href.startsWith("/") && !href.startsWith("//")),
    "href must be http(s) or a relative path"
  );

const markSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("bold") }).strict(),
  z.object({ type: z.literal("italic") }).strict(),
  z.object({ type: z.literal("link"), attrs: z.object({ href: hrefSchema }).strict() }).strict()
]);

const textNodeSchema = z
  .object({ type: z.literal("text"), text: z.string().min(1).max(5000), marks: z.array(markSchema).max(5).optional() })
  .strict();
const hardBreakNodeSchema = z.object({ type: z.literal("hardBreak") }).strict();
const inlineNodeSchema = z.discriminatedUnion("type", [textNodeSchema, hardBreakNodeSchema]);

const paragraphSchema = z
  .object({ type: z.literal("paragraph"), content: z.array(inlineNodeSchema).max(1000).optional() })
  .strict();
const headingSchema = z
  .object({
    type: z.literal("heading"),
    attrs: z.object({ level: z.union([z.literal(2), z.literal(3)]) }).strict(),
    content: z.array(inlineNodeSchema).max(200).optional()
  })
  .strict();

const listItemSchema: $ZodTypeDiscriminable = z.lazy(() =>
  z
    .object({
      type: z.literal("listItem"),
      content: z.array(z.union([paragraphSchema, bulletListSchema, orderedListSchema])).min(1).max(100)
    })
    .strict()
);
const bulletListSchema: $ZodTypeDiscriminable = z.lazy(() =>
  z.object({ type: z.literal("bulletList"), content: z.array(listItemSchema).min(1).max(200) }).strict()
);
const orderedListSchema: $ZodTypeDiscriminable = z.lazy(() =>
  z.object({ type: z.literal("orderedList"), content: z.array(listItemSchema).min(1).max(200) }).strict()
);

const blockquoteSchema = z
  .object({ type: z.literal("blockquote"), content: z.array(paragraphSchema).min(1).max(50) })
  .strict();

const mediaAttrsSchema = z
  .object({ assetId: z.string().min(1).max(200), alt: z.string().max(300), caption: z.string().max(300).optional() })
  .strict();
const imageSchema = z.object({ type: z.literal("image"), attrs: mediaAttrsSchema }).strict();
const patternImageSchema = z.object({ type: z.literal("patternImage"), attrs: mediaAttrsSchema }).strict();
const gallerySchema = z
  .object({ type: z.literal("gallery"), attrs: z.object({ items: z.array(mediaAttrsSchema).min(1).max(12) }).strict() })
  .strict();

const stepContentSchema = z.union([paragraphSchema, bulletListSchema, orderedListSchema, imageSchema]);
const stepSchema = z
  .object({
    type: z.literal("step"),
    attrs: z.object({ title: z.string().min(1).max(200) }).strict(),
    content: z.array(stepContentSchema).min(1).max(100)
  })
  .strict();

const patternEmbedSchema = z
  .object({ type: z.literal("patternEmbed"), attrs: z.object({ patternId: z.string().min(1).max(200) }).strict() })
  .strict();

const videoSchema = z
  .object({
    type: z.literal("video"),
    attrs: z
      .object({
        provider: z.literal("youtube"),
        videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
        title: z.string().max(200).optional()
      })
      .strict()
  })
  .strict();

const topLevelBlockSchema = z.discriminatedUnion("type", [
  paragraphSchema,
  headingSchema,
  bulletListSchema,
  orderedListSchema,
  blockquoteSchema,
  imageSchema,
  patternImageSchema,
  gallerySchema,
  stepSchema,
  patternEmbedSchema,
  videoSchema
]);

export const contentDocSchema = z
  .object({ type: z.literal("doc"), content: z.array(topLevelBlockSchema).max(MAX_CONTENT_BLOCKS) })
  .strict();

/** Throws ZodError (unknown node/attr, bad href, heading level, >300 blocks) or Error (>1MB). */
export function validateContentDoc(json: unknown): ContentDoc {
  const bytes = Buffer.byteLength(JSON.stringify(json ?? null), "utf8");
  if (bytes > MAX_CONTENT_BYTES) {
    throw new Error("Content document exceeds 1MB");
  }
  return contentDocSchema.parse(json) as unknown as ContentDoc;
}
