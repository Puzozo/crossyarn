import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/admin-session";
import { masterClassPublishErrors, revalidateMasterClass } from "@/lib/content/repo-shared";

/** Publish a master class — 422 with the missing fields if the checklist fails (§7). */
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const mc = await db.masterClass.findUnique({ where: { id } });
  if (!mc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const missing = masterClassPublishErrors(mc);
  if (missing.length > 0) {
    // Status is left untouched when the checklist fails.
    return NextResponse.json({ error: "INCOMPLETE", fields: missing }, { status: 422 });
  }

  await db.masterClass.update({
    where: { id },
    data: { status: "PUBLISHED", publishedAt: mc.publishedAt ?? new Date() }
  });
  revalidateMasterClass(mc.slug);
  return NextResponse.json({ ok: true, status: "PUBLISHED" });
}

/** Unpublish — back to DRAFT; publishedAt stays set so the slug remains locked (§7). */
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const mc = await db.masterClass.findUnique({ where: { id }, select: { slug: true } });
  if (!mc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.masterClass.update({ where: { id }, data: { status: "DRAFT" } });
  revalidateMasterClass(mc.slug);
  return NextResponse.json({ ok: true, status: "DRAFT" });
}
