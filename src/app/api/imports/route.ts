import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { requirePremium, PremiumRequiredError } from "@/lib/billing/premium";
import { checkRateLimitWindow } from "@/lib/auth/rate-limit";
import { saveImportImage, extForType } from "@/lib/import-pipeline/storage";
import { dispatchQueue } from "@/lib/import-pipeline/queue";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB — photos of charts, far above the 300KB symbol cap
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function GET() {
  // List the current user's import jobs (Could-have; cheap own-scoped query).
  try {
    const session = await requireSession();
    const jobs = await db.patternImportJob.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true, createdAt: true }
    });
    return NextResponse.json(jobs);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  // 1. Premium gate — distinguish 401 (not logged in) from 403 (logged in, not Premium)
  //    so the UI can show the right thing (sign-in vs upsell).
  let session;
  try {
    session = await requirePremium();
  } catch (error) {
    if (error instanceof PremiumRequiredError) {
      return NextResponse.json({ error: "PREMIUM_REQUIRED" }, { status: 403 });
    }
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  // 2. Rate limit on the user (the resource is tied to the account, not the IP):
  //    burst 2/min + 5/hour. Each import is seconds of CPU.
  const burst = checkRateLimitWindow(`import:burst:${session.userId}`, 2, 60_000);
  if (!burst.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED", retryAfter: burst.retryAfterSeconds },
      { status: 429 }
    );
  }
  const hourly = checkRateLimitWindow(`import:hour:${session.userId}`, 5, 3_600_000);
  if (!hourly.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED", retryAfter: hourly.retryAfterSeconds },
      { status: 429 }
    );
  }

  // 3. Read and validate the upload.
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("image");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "INVALID_FILE" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "INVALID_FORMAT" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "FILE_TOO_LARGE" }, { status: 413 });
  }
  if (!extForType(file.type)) {
    return NextResponse.json({ error: "INVALID_FORMAT" }, { status: 400 });
  }

  // 4. Idempotency: a retried/double-submitted upload must not spawn a second heavy job.
  const idempotencyKey = request.headers.get("Idempotency-Key") || undefined;
  if (idempotencyKey) {
    const existing = await db.patternImportJob.findUnique({ where: { idempotencyKey } });
    if (existing) {
      if (existing.userId !== session.userId) {
        return NextResponse.json({ error: "CONFLICT" }, { status: 409 });
      }
      return NextResponse.json({ id: existing.id }, { status: 200 });
    }
  } else {
    // No key → guard against accidental concurrent imports (one active per user).
    const active = await db.patternImportJob.findFirst({
      where: { userId: session.userId, status: { in: ["PENDING", "PROCESSING"] } },
      select: { id: true }
    });
    if (active) {
      return NextResponse.json({ error: "ACTIVE_IMPORT_EXISTS", id: active.id }, { status: 409 });
    }
  }

  // 5. Persist the image off-public-root, then create the job in PENDING.
  //    NOTE: pixel-dimension validation (pixel-bomb guard) happens in the recognition
  //    service which decodes the image; we cap byte size + type here.
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const job = await db.patternImportJob.create({
      data: {
        userId: session.userId,
        sourceImageUrl: "pending",
        status: "PENDING",
        fileSizeBytes: file.size,
        idempotencyKey
      }
    });
    const filename = await saveImportImage(job.id, bytes, file.type);
    await db.patternImportJob.update({
      where: { id: job.id },
      data: { sourceImageUrl: filename }
    });

    // Pull into PROCESSING if a slot is free (don't block the response).
    void dispatchQueue();

    return NextResponse.json({ id: job.id }, { status: 201 });
  } catch (error) {
    console.error("Import create failed:", error);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
