import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/auth/same-origin";
import { clearSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  await clearSession();
  return NextResponse.json({ ok: true });
}