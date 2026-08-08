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
