import { NextResponse } from "next/server";
import { completeJob } from "@/lib/import-pipeline/queue";
import { ImportErrorType, ImportResult } from "@/lib/import-pipeline/contracts";

export const runtime = "nodejs";

/**
 * INTERNAL callback for the Python recognition service.
 *
 * Authenticated ONLY by a shared secret header — never a user cookie/session. Kept
 * in a separate /api/internal/* namespace (not the public /api/imports/[id]) so the
 * auth model is unambiguous and Caddy can block /api/internal/* from the public
 * listener. The Python process reaches it over 127.0.0.1.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const key = request.headers.get("X-Internal-Key");
  const expected = process.env.INTERNAL_API_KEY;
  if (!expected || key !== expected) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.status !== "string") {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }

  if (body.status === "READY" && body.result) {
    await completeJob(id, { status: "READY", result: body.result as ImportResult });
    return NextResponse.json({ ok: true });
  }
  if (body.status === "FAILED") {
    const errorType = (body.errorType as ImportErrorType) ?? "internal-error";
    await completeJob(id, { status: "FAILED", errorType });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
}
