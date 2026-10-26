// Server routes return stable error codes; translate them here so the UI never
// shows a raw code or a message in the wrong language.
const KNOWN = new Set([
  "RATE_LIMITED", "INVALID_CREDENTIALS", "ACCOUNT_DISABLED", "INVALID_INPUT",
  "EMAIL_IN_USE", "INVALID_TAG", "TOO_MANY_TAGS"
]);

type Translate = (key: never, vars?: Record<string, string | number>) => string;

export function apiErrorMessage(t: Translate, data: unknown, fallbackKey: string): string {
  const body = (data ?? {}) as { error?: unknown; retryAfterSeconds?: unknown };
  const code = typeof body.error === "string" ? body.error : "";
  if (!KNOWN.has(code)) return t(fallbackKey as never);
  if (code === "RATE_LIMITED") {
    const seconds = typeof body.retryAfterSeconds === "number" ? body.retryAfterSeconds : 60;
    return t("errors.RATE_LIMITED" as never, { minutes: Math.max(1, Math.ceil(seconds / 60)) });
  }
  return t(`errors.${code}` as never);
}
