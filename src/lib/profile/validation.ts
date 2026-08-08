import { z } from "zod";

/**
 * Handles that would collide with existing top-level routes or read as
 * impersonation. Checked case-insensitively against the lowercased username.
 */
export const RESERVED_USERNAMES = new Set([
  "admin",
  "account",
  "api",
  "auth",
  "u",
  "p",
  "patterns",
  "editor",
  "imports",
  "premium",
  "sign-in",
  "sign-up",
  "signin",
  "signup",
  "privacy",
  "terms",
  "explore",
  "settings",
  "crossyarn",
  "support",
  "help",
  "about",
  "me",
  "new"
]);

// Handle: lowercase letters/digits/underscore, 3–30 chars. Validated case-insensitively
// here; the route lowercases before persisting so /u/<username> lookups are canonical.
const usernameField = z
  .string()
  .trim()
  .min(3)
  .max(30)
  .regex(/^[a-zA-Z0-9_]+$/);

/**
 * Shape validation for PATCH /api/profile. Empty strings are allowed (they mean
 * "clear this field") and normalized to null in the route. Semantic checks that
 * need the DB or cross-field logic (uniqueness, reserved names, "public requires
 * a username") live in the route, not here.
 */
export const profileUpdateSchema = z.object({
  name: z.string().trim().max(60).optional().or(z.literal("")),
  username: usernameField.optional().or(z.literal("")),
  bio: z.string().trim().max(300).optional().or(z.literal("")),
  location: z.string().trim().max(80).optional().or(z.literal("")),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  profilePublic: z.boolean()
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

/**
 * Normalizes a user-entered website to a safe absolute http(s) URL, or returns
 * null. Guards against `javascript:`/`data:` and other schemes so the value can
 * be dropped into an <a href> without an XSS vector. A bare "example.com" is
 * upgraded to https://. Returns null (not an error) for blank input.
 */
export function normalizeWebsite(raw: string | undefined | null): { ok: true; value: string | null } | { ok: false } {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return { ok: true, value: null };
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return { ok: false };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return { ok: false };
  if (!url.hostname.includes(".")) return { ok: false };
  return { ok: true, value: url.toString() };
}
