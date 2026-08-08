import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

export const runtime = "nodejs";

/**
 * Poll a job's status. Gated by OWNERSHIP, not Premium: a user whose subscription
 * lapsed after starting a job must still be able to read the result they already
 * triggered. Polling is a cheap row read and not part of resource control.
 */
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
    select: { id: true, userId: true, status: true, errorMessage: true, resultData: true }
  });

  if (!job || job.userId !== session.userId) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // While PENDING/PROCESSING the redetect params may sit in resultData — don't leak them.
  const result = job.status === "READY" ? job.resultData : null;

  return NextResponse.json({
    id: job.id,
    status: job.status,
    errorMessage: job.errorMessage,
    result
  });
}
