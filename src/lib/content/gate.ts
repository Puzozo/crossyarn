import type { ContentDoc } from "./types";

/** Заглушка під майбутній білінг: доступ є, якщо контент безкоштовний або переглядає admin. */
export function canAccessMasterClass(priceUah: number | null, isAdmin: boolean): boolean {
  return priceUah == null || isAdmin;
}

export function gateContent(
  doc: ContentDoc,
  meta: { priceUah: number | null; previewBlockCount: number },
  hasAccess: boolean
): { doc: ContentDoc; locked: boolean } {
  if (hasAccess || meta.priceUah == null) {
    return { doc, locked: false };
  }
  return { doc: { ...doc, content: doc.content.slice(0, meta.previewBlockCount) }, locked: true };
}
