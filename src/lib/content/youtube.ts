export const YOUTUBE_VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function parseYouTubeId(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.toLowerCase();
  let id: string | null = null;
  if (host === "youtu.be") {
    id = parsed.pathname.slice(1).split("/")[0] || null;
  } else if (host === "youtube.com" || host.endsWith(".youtube.com")) {
    if (parsed.pathname === "/watch") {
      id = parsed.searchParams.get("v");
    } else if (parsed.pathname.startsWith("/shorts/")) {
      id = parsed.pathname.slice("/shorts/".length).split("/")[0] || null;
    } else if (parsed.pathname.startsWith("/embed/")) {
      id = parsed.pathname.slice("/embed/".length).split("/")[0] || null;
    }
  }
  return id && YOUTUBE_VIDEO_ID_RE.test(id) ? id : null;
}
