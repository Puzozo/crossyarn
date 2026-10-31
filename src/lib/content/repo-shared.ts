// Shared helpers + zod schemas for the admin MasterClass / Post APIs (spec §6, §7).
// Both entities store JSON fields as Strings (materials/gallery/tags/content), validate
// the Tiptap content with validateContentDoc, resolve slugs with the same rules and share
// optimistic-concurrency + pattern-visibility checks. Entity-specific route handlers in
// src/app/api/admin/{master-classes,posts} build on these.
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { serializeTags } from "@/lib/utils";
import { isValidSlug, isTsxBlogSlug, slugify } from "./slug";
import { materialsSchema } from "./materials";
import { gallerySchema } from "./gallery";
import { validateContentDoc, MAX_CONTENT_BLOCKS } from "./schema";
import type { ContentDoc } from "./types";

// ── Error signalling ─────────────────────────────────────────────────────────
// Route handlers catch this and map it straight to a JSON response.
export class ContentApiError extends Error {
  constructor(
    public status: number,
    public body: Record<string, unknown>
  ) {
    super(typeof body.error === "string" ? body.error : "content_error");
    this.name = "ContentApiError";
  }
}

// ── Shared field schemas ───────────────────────────────────────────────────────
const langSchema = z.enum(["uk", "en"]);
const tagsSchema = z.array(z.string().trim().min(1).max(40)).max(20);
const difficultySchema = z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]);
// content is validated by validateContentDoc (block whitelist + 1MB cap), not here.
const contentSchema = z.unknown();

export const createMasterClassSchema = z
  .object({
    slug: z.string().max(80).optional(),
    lang: langSchema,
    translationOfId: z.string().min(1).nullable().optional(),
    title: z.string().min(1).max(160),
    summary: z.string().max(500).optional(),
    coverAssetId: z.string().min(1).nullable().optional(),
    coverAlt: z.string().max(300).optional(),
    difficulty: difficultySchema.optional(),
    durationMinutes: z.number().int().min(1).max(100_000).nullable().optional(),
    materials: materialsSchema.optional(),
    tags: tagsSchema.optional(),
    mainPatternId: z.string().min(1).nullable().optional(),
    gallery: gallerySchema.optional(),
    content: contentSchema.optional(),
    priceUah: z.number().int().min(0).nullable().optional(),
    previewBlockCount: z.number().int().min(0).max(MAX_CONTENT_BLOCKS).optional()
  })
  .strict();

export const patchMasterClassSchema = z
  .object({
    updatedAt: z.string().min(1),
    slug: z.string().max(80).optional(),
    lang: langSchema.optional(),
    translationOfId: z.string().min(1).nullable().optional(),
    title: z.string().min(1).max(160).optional(),
    summary: z.string().max(500).optional(),
    coverAssetId: z.string().min(1).nullable().optional(),
    coverAlt: z.string().max(300).optional(),
    difficulty: difficultySchema.optional(),
    durationMinutes: z.number().int().min(1).max(100_000).nullable().optional(),
    materials: materialsSchema.optional(),
    tags: tagsSchema.optional(),
    mainPatternId: z.string().min(1).nullable().optional(),
    gallery: gallerySchema.optional(),
    content: contentSchema.optional(),
    priceUah: z.number().int().min(0).nullable().optional(),
    previewBlockCount: z.number().int().min(0).max(MAX_CONTENT_BLOCKS).optional()
  })
  .strict();

export const createPostSchema = z
  .object({
    slug: z.string().max(80).optional(),
    lang: langSchema,
    translationOf: z.string().min(1).max(80).nullable().optional(),
    title: z.string().min(1).max(60),
    heading: z.string().min(1).max(200),
    description: z.string().min(1).max(155),
    tags: tagsSchema.optional(),
    coverAssetId: z.string().min(1).nullable().optional(),
    coverAlt: z.string().max(300).optional(),
    content: contentSchema.optional()
  })
  .strict();

export const patchPostSchema = z
  .object({
    updatedAt: z.string().min(1),
    slug: z.string().max(80).optional(),
    lang: langSchema.optional(),
    translationOf: z.string().min(1).max(80).nullable().optional(),
    title: z.string().min(1).max(60).optional(),
    heading: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(155).optional(),
    tags: tagsSchema.optional(),
    coverAssetId: z.string().min(1).nullable().optional(),
    coverAlt: z.string().max(300).optional(),
    content: contentSchema.optional()
  })
  .strict();

export type CreateMasterClassInput = z.infer<typeof createMasterClassSchema>;
export type PatchMasterClassInput = z.infer<typeof patchMasterClassSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type PatchPostInput = z.infer<typeof patchPostSchema>;

// ── Slug ───────────────────────────────────────────────────────────────────────
/** Resolve a slug for create: explicit value or derived from the title; 422 if invalid. */
export function resolveNewSlug(explicit: string | undefined, title: string, isPost: boolean): string {
  const slug = (explicit && explicit.length ? explicit : slugify(title)).toLowerCase();
  assertSlugAllowed(slug, isPost);
  return slug;
}

/** Format / reserved / TSX-collision check (422). DB uniqueness is handled separately. */
export function assertSlugAllowed(slug: string, isPost: boolean): void {
  if (!isValidSlug(slug)) {
    throw new ContentApiError(422, { error: "INVALID_SLUG", fields: ["slug"] });
  }
  if (isPost && isTsxBlogSlug(slug)) {
    throw new ContentApiError(422, { error: "SLUG_TAKEN", fields: ["slug"] });
  }
}

// ── Optimistic concurrency ──────────────────────────────────────────────────────
/** 409 if the client's updatedAt no longer matches the stored row. */
export function assertFresh(incoming: string, current: Date): void {
  if (new Date(incoming).getTime() !== current.getTime()) {
    throw new ContentApiError(409, { error: "STALE" });
  }
}

/** 409 if a published row (publishedAt != null) tries to change its slug. */
export function assertSlugNotLocked(publishedAt: Date | null, currentSlug: string, nextSlug: string): void {
  if (publishedAt && nextSlug !== currentSlug) {
    throw new ContentApiError(409, { error: "SLUG_LOCKED" });
  }
}

// ── Pattern visibility ──────────────────────────────────────────────────────────
/** Top-level patternEmbed ids referenced by a content doc. */
export function collectPatternEmbedIds(doc: ContentDoc): string[] {
  return doc.content.filter((b) => b.type === "patternEmbed").map((b) => b.attrs.patternId);
}

/** 422 PATTERN_NOT_PUBLIC if any referenced pattern is missing or PRIVATE. */
export async function assertPatternsVisible(patternIds: Array<string | null | undefined>): Promise<void> {
  const unique = [...new Set(patternIds.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return;
  const found = await db.pattern.findMany({
    where: { id: { in: unique }, visibility: { in: ["PUBLIC", "UNLISTED"] } },
    select: { id: true }
  });
  const ok = new Set(found.map((p) => p.id));
  const bad = unique.filter((id) => !ok.has(id));
  if (bad.length > 0) {
    throw new ContentApiError(422, { error: "PATTERN_NOT_PUBLIC", patternIds: bad });
  }
}

// ── Content parsing ──────────────────────────────────────────────────────────────
/** Validate an incoming content doc (throws ContentApiError 422 on bad JSON). */
export function parseIncomingContent(raw: unknown): ContentDoc {
  try {
    return validateContentDoc(raw);
  } catch {
    throw new ContentApiError(422, { error: "INVALID_CONTENT", fields: ["content"] });
  }
}

/** Parse a stored content string; empty doc on any failure (never throws). */
export function parseStoredContent(raw: string): ContentDoc {
  try {
    return validateContentDoc(JSON.parse(raw));
  } catch {
    return { type: "doc", content: [] };
  }
}

// ── Publish checklists (spec §7) ─────────────────────────────────────────────────
function collectImageAlts(doc: ContentDoc): string[] {
  const alts: string[] = [];
  for (const block of doc.content) {
    if (block.type === "image" || block.type === "patternImage") {
      alts.push(block.attrs.alt);
    } else if (block.type === "gallery") {
      for (const item of block.attrs.items) alts.push(item.alt);
    } else if (block.type === "step") {
      for (const child of block.content) if (child.type === "image") alts.push(child.attrs.alt);
    }
  }
  return alts;
}

export type MasterClassPublishable = {
  title: string;
  slug: string;
  summary: string;
  coverAssetId: string | null;
  coverAlt: string;
  durationMinutes: number | null;
  gallery: string;
  content: string;
};

/** Missing-field list for publishing a master class (empty = ready). */
export function masterClassPublishErrors(mc: MasterClassPublishable): string[] {
  const missing: string[] = [];
  if (!mc.title.trim()) missing.push("title");
  if (!mc.slug) missing.push("slug");
  if (!mc.summary.trim()) missing.push("summary");
  if (!mc.coverAssetId) missing.push("cover");
  else if (!mc.coverAlt.trim()) missing.push("coverAlt");
  if (mc.durationMinutes == null) missing.push("durationMinutes");

  const doc = parseStoredContent(mc.content);
  if (doc.content.length === 0) missing.push("content");

  const galleryAlts = galleryItemsFromJson(mc.gallery).map((g) => g.alt);
  const allAlts = [...collectImageAlts(doc), ...galleryAlts];
  if (allAlts.some((alt) => !alt.trim())) missing.push("imageAlt");

  return missing;
}

export type PostPublishable = {
  title: string;
  heading: string;
  description: string;
  content: string;
};

/** Missing-field list for publishing a post (empty = ready). */
export function postPublishErrors(post: PostPublishable): string[] {
  const missing: string[] = [];
  if (!post.title.trim() || post.title.length > 60) missing.push("title");
  if (!post.heading.trim()) missing.push("heading");
  if (!post.description.trim() || post.description.length > 155) missing.push("description");
  const doc = parseStoredContent(post.content);
  if (doc.content.length === 0) missing.push("content");
  return missing;
}

function galleryItemsFromJson(raw: string): Array<{ alt: string }> {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ── Translation link (MasterClass, symmetric) ──────────────────────────────────────
type MasterClassTx = Prisma.TransactionClient;

/**
 * Point `selfId` and `targetId` at each other, clearing any previous partners of
 * either row first (so a @unique translationOfId never collides). Call inside a tx.
 */
export async function linkTranslation(tx: MasterClassTx, selfId: string, targetId: string): Promise<void> {
  await tx.masterClass.updateMany({
    where: { translationOfId: { in: [selfId, targetId] } },
    data: { translationOfId: null }
  });
  await tx.masterClass.update({ where: { id: selfId }, data: { translationOfId: null } });
  await tx.masterClass.update({ where: { id: targetId }, data: { translationOfId: null } });
  await tx.masterClass.update({ where: { id: selfId }, data: { translationOfId: targetId } });
  await tx.masterClass.update({ where: { id: targetId }, data: { translationOfId: selfId } });
}

/** Drop `selfId`'s link and anyone pointing back at it. Call inside a tx. */
export async function unlinkTranslation(tx: MasterClassTx, selfId: string): Promise<void> {
  await tx.masterClass.updateMany({ where: { translationOfId: selfId }, data: { translationOfId: null } });
  await tx.masterClass.update({ where: { id: selfId }, data: { translationOfId: null } });
}

/** Resolve + validate (422) a translation target: exists, different id, different lang. */
export async function resolveTranslationTarget(targetId: string, selfLang: string, selfId: string | null): Promise<void> {
  const target = await db.masterClass.findUnique({ where: { id: targetId }, select: { id: true, lang: true } });
  if (!target || target.id === selfId || target.lang === selfLang) {
    throw new ContentApiError(422, { error: "INVALID_TRANSLATION", fields: ["translationOfId"] });
  }
}

// ── Field mapping ───────────────────────────────────────────────────────────────
/** Map provided master-class fields onto a Prisma data object (JSON fields serialized). */
export function applyMasterClassFields(
  data: Record<string, unknown>,
  input: Partial<CreateMasterClassInput & PatchMasterClassInput>,
  content: ContentDoc | undefined
): void {
  if (input.title !== undefined) data.title = input.title;
  if (input.summary !== undefined) data.summary = input.summary;
  if (input.coverAssetId !== undefined) data.coverAssetId = input.coverAssetId;
  if (input.coverAlt !== undefined) data.coverAlt = input.coverAlt;
  if (input.difficulty !== undefined) data.difficulty = input.difficulty;
  if (input.durationMinutes !== undefined) data.durationMinutes = input.durationMinutes;
  if (input.materials !== undefined) data.materials = JSON.stringify(input.materials);
  if (input.tags !== undefined) data.tags = serializeTags(input.tags);
  if (input.mainPatternId !== undefined) data.mainPatternId = input.mainPatternId;
  if (input.gallery !== undefined) data.gallery = JSON.stringify(input.gallery);
  if (content !== undefined) data.content = JSON.stringify(content);
  if (input.priceUah !== undefined) data.priceUah = input.priceUah;
  if (input.previewBlockCount !== undefined) data.previewBlockCount = input.previewBlockCount;
}

/** Map provided post fields onto a Prisma data object (JSON fields serialized). */
export function applyPostFields(
  data: Record<string, unknown>,
  input: Partial<CreatePostInput & PatchPostInput>,
  content: ContentDoc | undefined
): void {
  if (input.title !== undefined) data.title = input.title;
  if (input.heading !== undefined) data.heading = input.heading;
  if (input.description !== undefined) data.description = input.description;
  if (input.tags !== undefined) data.tags = serializeTags(input.tags);
  if (input.coverAssetId !== undefined) data.coverAssetId = input.coverAssetId;
  if (input.coverAlt !== undefined) data.coverAlt = input.coverAlt;
  if (content !== undefined) data.content = JSON.stringify(content);
}

// ── Revalidation (spec §7) ──────────────────────────────────────────────────────
export function revalidateMasterClass(slug: string): void {
  revalidatePath(`/master-classes/${slug}`);
  revalidatePath("/master-classes");
  revalidatePath("/sitemap.xml");
}

export function revalidatePost(slug: string): void {
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
}
