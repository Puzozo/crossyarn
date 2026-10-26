/**
 * Rejects cross-site requests to cookie-only endpoints that SameSite can't protect
 * (sign-out needs no session cookie, so a foreign page could POST to it and log the
 * user out). Browsers send Origin on POST and Sec-Fetch-Site on all requests;
 * clients that send neither (curl, server-to-server) aren't a CSRF vector.
 */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host === request.headers.get("host");
    } catch {
      return false;
    }
  }
  const fetchSite = request.headers.get("sec-fetch-site");
  return !fetchSite || fetchSite === "same-origin" || fetchSite === "none";
}
