import type { ContentDoc } from "./types";

/** Заглушка під майбутній білінг: доступ є, якщо контент безкоштовний або переглядає admin. */
export function canAccessMasterClass(priceUah: number | null, isAdmin: boolean): boolean {
  return priceUah == null || isAdmin;
}

/**
 * Хто бачить захищене відео (Bunny) у блоці protectedVideo.
 * Гість — ніколи (лише заглушка входу). Безкоштовний контент — будь-який авторизований.
 * Платний (priceUah != null) — лише автор або admin; купівель ще немає, майбутній
 * маркетплейс додасть сюди перевірку покупки за userId.
 */
export function hasProtectedVideoAccess(opts: {
  userId: string | null;
  isAdmin: boolean;
  priceUah: number | null;
  authorId: string | null;
}): boolean {
  if (!opts.userId) return false;
  if (opts.priceUah == null) return true;
  return opts.isAdmin || opts.userId === opts.authorId;
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
