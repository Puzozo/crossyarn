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

export function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
