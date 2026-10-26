// Symbol images are stored as data URIs. Only base64 raster/SVG images are allowed:
// the base64 alphabet has no quotes, parentheses or angle brackets, so a value that
// passes can be embedded in CSS url("…") and SVG href="…" without breaking out.
const SAFE_IMAGE_DATA_URI = /^data:image\/(png|jpeg|gif|webp|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/;

export const MAX_SYMBOL_IMAGE_BYTES = 300_000;

export function isSafeImageDataUri(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= MAX_SYMBOL_IMAGE_BYTES &&
    SAFE_IMAGE_DATA_URI.test(value)
  );
}
