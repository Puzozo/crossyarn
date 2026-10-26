import { NextResponse } from "next/server";

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();
const WINDOW_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

/**
 * Resolve the client IP for rate-limiting. Caddy appends the real remote address
 * as the LAST entry of X-Forwarded-For, so the rightmost value is the one a client
 * cannot spoof. Taking the leftmost (client-supplied) value would let an attacker
 * bypass the limiter by rotating a fake header.
 */
export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Generic fixed-window limiter. `key` namespaces the counter, so callers with
 * different windows (auth vs imports, burst vs hourly) must use distinct keys.
 *
 * In-memory: one Map per Next process. Acceptable while we run a single PM2
 * process; would need to move to the DB if Next is ever clustered. A restart
 * resets all counters — fine for short anti-abuse windows.
 */
export function checkRateLimitWindow(
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  // Drop expired counters now and then so per-user/per-IP keys don't accumulate forever.
  if (store.size > 10_000) {
    for (const [k, e] of store) if (e.resetAt <= now) store.delete(k);
  }
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= maxAttempts) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Auth limiter: 5 attempts / minute. Unchanged public API. */
export function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds: number } {
  return checkRateLimitWindow(key, MAX_ATTEMPTS, WINDOW_MS);
}

/** 429 response for a limiter verdict, or null when the request may proceed. */
export function rateLimitResponse(
  key: string,
  maxAttempts: number,
  windowMs: number
): NextResponse | null {
  const { allowed, retryAfterSeconds } = checkRateLimitWindow(key, maxAttempts, windowMs);
  if (allowed) return null;
  return NextResponse.json(
    { error: "RATE_LIMITED", retryAfterSeconds },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}

// Per-user budgets for authenticated writes. `save` covers editor autosave
// (debounced 1.2s, so ~50/min while drawing nonstop); `create` adds new rows.
const WRITE_LIMITS = {
  save: { max: 120, windowMs: 60_000 },
  write: { max: 60, windowMs: 60_000 },
  create: { max: 60, windowMs: 3_600_000 }
} as const;

export function limitWrite(userId: string, bucket: keyof typeof WRITE_LIMITS): NextResponse | null {
  const { max, windowMs } = WRITE_LIMITS[bucket];
  return rateLimitResponse(`write:${bucket}:${userId}`, max, windowMs);
}
