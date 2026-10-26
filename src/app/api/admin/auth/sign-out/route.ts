import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/lib/auth/same-origin";
import { clearAdminSession } from "@/lib/auth/admin-session";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}
