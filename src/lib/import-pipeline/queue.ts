import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ImportErrorType, ImportResult } from "@/lib/import-pipeline/contracts";
import { recognizeMock } from "@/lib/import-pipeline/mock-recognizer";

/**
 * Image-import job queue.
 *
 * The recognition engine (Python, CPU-bound) is the scarce resource, so jobs are
 * created in PENDING and only promoted to PROCESSING when a slot is free. The DB is
 * the source of truth for slot accounting — never an in-memory counter, which would
 * desync on restart and can't see work the Python process is still doing.
 */

const MAX_CONCURRENT = Number(process.env.IMPORT_MAX_CONCURRENT ?? 2);
const STALE_MS = Number(process.env.IMPORT_STALE_MINUTES ?? 10) * 60 * 1000;
const PYTHON_URL = process.env.IMPORT_PYTHON_URL; // unset → use the built-in mock

type RedetectParams = { width: number; height: number };

function readRedetectParams(resultData: unknown): RedetectParams | undefined {
  if (resultData && typeof resultData === "object" && "redetect" in resultData) {
    const r = (resultData as { redetect?: RedetectParams }).redetect;
    if (r && typeof r.width === "number" && typeof r.height === "number") return r;
  }
  return undefined;
}

/** Move PROCESSING jobs that overran the stale window into FAILED so their slot frees up. */
export async function reapStaleJobs(): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_MS);
  await db.patternImportJob.updateMany({
    where: { status: "PROCESSING", processingStartedAt: { lt: cutoff } },
    data: { status: "FAILED", errorMessage: "timeout" satisfies ImportErrorType }
  });
}

/** Mark a job done. Called by the mock path and by the Python callback route. */
export async function completeJob(
  jobId: string,
  outcome:
    | { status: "READY"; result: ImportResult }
    | { status: "FAILED"; errorType: ImportErrorType }
): Promise<void> {
  if (outcome.status === "READY") {
    await db.patternImportJob.update({
      where: { id: jobId },
      data: {
        status: "READY",
        resultData: outcome.result as unknown as Prisma.InputJsonValue,
        errorMessage: null
      }
    });
  } else {
    await db.patternImportJob.update({
      where: { id: jobId },
      data: { status: "FAILED", errorMessage: outcome.errorType }
    });
  }
  // A slot just opened — try to pull the next PENDING job.
  void dispatchQueue();
}

async function startJob(job: {
  id: string;
  sourceImageUrl: string;
  resultData: unknown;
}): Promise<void> {
  const redetect = readRedetectParams(job.resultData);

  if (PYTHON_URL) {
    // Real engine: fire-and-forget. Python does the work and calls back the internal
    // callback route, which invokes completeJob(). We do not hold this request open.
    try {
      await fetch(`${PYTHON_URL.replace(/\/$/, "")}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Key": process.env.INTERNAL_API_KEY ?? ""
        },
        body: JSON.stringify({
          jobId: job.id,
          imageRef: job.sourceImageUrl,
          width: redetect?.width,
          height: redetect?.height
        })
      });
    } catch {
      await completeJob(job.id, { status: "FAILED", errorType: "service-unavailable" });
    }
    return;
  }

  // Mock engine: compute synchronously and complete in-process.
  try {
    const result = recognizeMock({
      seed: job.id,
      width: redetect?.width,
      height: redetect?.height
    });
    await completeJob(job.id, { status: "READY", result });
  } catch {
    await completeJob(job.id, { status: "FAILED", errorType: "internal-error" });
  }
}

/**
 * Pull PENDING jobs into PROCESSING up to MAX_CONCURRENT. Safe to call often
 * (after create, after redetect, after completion). Promotion is atomic via
 * updateMany on the PENDING status to avoid two callers grabbing the same job.
 */
export async function dispatchQueue(): Promise<void> {
  await reapStaleJobs();

  let active = await db.patternImportJob.count({ where: { status: "PROCESSING" } });

  while (active < MAX_CONCURRENT) {
    const next = await db.patternImportJob.findFirst({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" }
    });
    if (!next) return;

    const claimed = await db.patternImportJob.updateMany({
      where: { id: next.id, status: "PENDING" },
      data: { status: "PROCESSING", processingStartedAt: new Date(), attemptCount: { increment: 1 } }
    });
    if (claimed.count === 0) {
      // Another caller grabbed it between findFirst and update — re-evaluate.
      active = await db.patternImportJob.count({ where: { status: "PROCESSING" } });
      continue;
    }

    active++;
    void startJob({ id: next.id, sourceImageUrl: next.sourceImageUrl, resultData: next.resultData });
  }
}
