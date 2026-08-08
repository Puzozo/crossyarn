import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePremium, PremiumRequiredError } from "@/lib/billing/premium";
import { checkRateLimitWindow } from "@/lib/auth/rate-limit";
import { dispatchQueue } from "@/lib/import-pipeline/queue";

export const runtime = "nodejs";

const redetectSchema = z.object({
  width: z.number().int().min(1).max(200),
  height: z.number().int().min(1).max(200)
});

/**
 * Re-run recognition with a user-corrected grid size. This is the same CPU-bound
 * inference as the initial import, so it gets the same Premium gate + rate limit +
 * ownership check. A lapsed-Premium user can still READ an old result but cannot
 * trigger a fresh (paid) inference.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await requirePremium();
  } catch (error) {
    if (error instanceof PremiumRequiredError) {
      return NextResponse.json({ error: "PREMIUM_REQUIRED" }, { status: 403 });
    }
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const burst = checkRateLimitWindow(`import:burst:${session.userId}`, 2, 60_000);
  if (!burst.allowed) {
    return NextResponse.json({ error: "RATE_LIMITED", retryAfter: burst.retryAfterSeconds }, { status: 429 });
  }

  const { id } = await params;
  const job = await db.patternImportJob.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true }
  });
  if (!job || job.userId !== session.userId) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (job.status === "PENDING" || job.status === "PROCESSING") {
    return NextResponse.json({ error: "ALREADY_RUNNING" }, { status: 409 });
  }

  const parsed = redetectSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PARAMS" }, { status: 400 });
  }

  await db.patternImportJob.update({
    where: { id },
    data: {
      status: "PENDING",
      processingStartedAt: null,
      errorMessage: null,
      // Stash the requested grid for the worker to honour; replaced by the real result.
      resultData: { redetect: parsed.data }
    }
  });

  void dispatchQueue();

  return NextResponse.json({ id, status: "PENDING" }, { status: 202 });
}
