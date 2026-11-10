import { createHash } from "crypto";

// Bunny Stream embed token authentication.
// Formula verified against https://bunny.net/docs/stream-embed-token-authentication (2026-11-10):
//   token   = SHA256_HEX(tokenSecurityKey + videoId + expiresUnixSeconds)
//   expires = UNIX timestamp in SECONDS
//   URL     = https://player.mediadelivery.net/embed/{libraryId}/{videoId}?token={hex}&expires={expires}
// The token key is secret and must never leave the server, so the public HTML only
// ever carries a short-lived token+expires — never a permanent/unsigned embed link.
const BUNNY_EMBED_HOST = "https://player.mediadelivery.net";
const DEFAULT_TTL_SEC = 15 * 60;

export function isBunnyConfigured(): boolean {
  return Boolean(process.env.BUNNY_STREAM_LIBRARY_ID && process.env.BUNNY_STREAM_TOKEN_KEY);
}

/**
 * Builds a signed, short-lived Bunny Stream embed URL for `videoId` (a Bunny GUID).
 * Returns `null` (and warns once on the server) when the env vars are missing, so
 * callers can fall back to an "unavailable" placeholder instead of crashing.
 */
export function signEmbedUrl(videoId: string, ttlSec: number = DEFAULT_TTL_SEC): string | null {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  const tokenKey = process.env.BUNNY_STREAM_TOKEN_KEY;
  if (!libraryId || !tokenKey) {
    console.warn(
      "[bunny] BUNNY_STREAM_LIBRARY_ID / BUNNY_STREAM_TOKEN_KEY not set — protected video unavailable"
    );
    return null;
  }
  const expires = Math.floor(Date.now() / 1000) + ttlSec;
  const token = createHash("sha256")
    .update(tokenKey + videoId + expires)
    .digest("hex");
  return `${BUNNY_EMBED_HOST}/embed/${libraryId}/${videoId}?token=${token}&expires=${expires}`;
}
