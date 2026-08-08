import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { readImportImage } from "@/lib/import-pipeline/storage";

export const runtime = "nodejs";

/** Serve the original uploaded image for the preview overlay. Owner-only. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const job = await db.patternImportJob.findUnique({
    where: { id },
    select: { userId: true, sourceImageUrl: true }
  });
  if (!job || job.userId !== session.userId) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const image = await readImportImage(job.sourceImageUrl);
  if (!image) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(image.data), {
    status: 200,
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "private, max-age=300"
    }
  });
}
