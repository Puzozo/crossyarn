/**
 * Finds MediaAsset rows that are no longer referenced by any MasterClass or
 * Post (any status, incl. DRAFT) and are older than 7 days.
 *
 * Run: npx tsx scripts/cleanup-media.ts           (dry-run: prints candidates)
 *      npx tsx scripts/cleanup-media.ts --delete   (removes files + DB rows)
 */
import { PrismaClient } from "@prisma/client";
import { deleteMediaVariants } from "../src/lib/content/media";

const db = new PrismaClient();
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function safeParseArray(raw: string): unknown[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface AssetRef {
  assetId?: string;
}
interface ContentNode {
  type?: string;
  attrs?: { assetId?: string; items?: AssetRef[] };
  content?: ContentNode[];
}

/** Top-level блоки Tiptap-доку: image/patternImage мають attrs.assetId, gallery — attrs.items[].assetId, step має content[] з можливими image. */
function collectAssetIdsFromContent(raw: string): string[] {
  const ids: string[] = [];
  let parsed: { content?: ContentNode[] };
  try {
    parsed = JSON.parse(raw) as { content?: ContentNode[] };
  } catch {
    return ids;
  }
  const blocks = Array.isArray(parsed?.content) ? parsed.content : [];
  for (const block of blocks) {
    if (block?.type === "image" || block?.type === "patternImage") {
      if (block.attrs?.assetId) ids.push(block.attrs.assetId);
    } else if (block?.type === "gallery") {
      for (const item of block.attrs?.items ?? []) if (item?.assetId) ids.push(item.assetId);
    } else if (block?.type === "step") {
      for (const child of block.content ?? []) {
        if (child?.type === "image" && child.attrs?.assetId) ids.push(child.attrs.assetId);
      }
    }
  }
  return ids;
}

function collectAssetIdsFromGalleryField(raw: string): string[] {
  return safeParseArray(raw)
    .map((item: { assetId?: string }) => item?.assetId)
    .filter((id: unknown): id is string => typeof id === "string");
}

async function main() {
  const isDelete = process.argv.includes("--delete");

  const usedIds = new Set<string>();
  const masterClasses = await db.masterClass.findMany({ select: { coverAssetId: true, gallery: true, content: true } });
  for (const mc of masterClasses) {
    if (mc.coverAssetId) usedIds.add(mc.coverAssetId);
    for (const id of collectAssetIdsFromGalleryField(mc.gallery)) usedIds.add(id);
    for (const id of collectAssetIdsFromContent(mc.content)) usedIds.add(id);
  }
  const posts = await db.post.findMany({ select: { coverAssetId: true, content: true } });
  for (const post of posts) {
    if (post.coverAssetId) usedIds.add(post.coverAssetId);
    for (const id of collectAssetIdsFromContent(post.content)) usedIds.add(id);
  }

  const cutoff = new Date(Date.now() - SEVEN_DAYS_MS);
  const allAssets = await db.mediaAsset.findMany({
    select: { id: true, originalName: true, sizeBytes: true, createdAt: true, variants: true }
  });
  const candidates = allAssets.filter((a) => !usedIds.has(a.id) && a.createdAt < cutoff);

  if (!isDelete) {
    console.log("[dry-run] " + candidates.length + " orphaned MediaAsset(s) older than 7 days (nothing deleted):");
    for (const c of candidates) {
      console.log("  " + c.id + "  " + c.originalName + "  " + c.sizeBytes + "B  created " + c.createdAt.toISOString());
    }
    console.log("Run with --delete to actually remove them.");
    return;
  }

  for (const c of candidates) {
    let filenames: string[] = [];
    try {
      filenames = Object.values(JSON.parse(c.variants)) as string[];
    } catch {
      filenames = [];
    }
    await deleteMediaVariants(filenames);
    await db.mediaAsset.delete({ where: { id: c.id } });
    console.log("deleted " + c.id + " (" + c.originalName + ")");
  }
  console.log("Deleted " + candidates.length + " MediaAsset(s).");
}

main().finally(() => db.$disconnect());
