import { translit } from "@/lib/translit";
import { getAllPosts } from "@/content/blog";

export const RESERVED_SLUGS = ["new", "admin", "tag", "page"];

/** Lowercase kebab slug з кириличного чи латинського заголовка, ≤80 символів. */
export function slugify(title: string): string {
  const latin = translit(title).toLowerCase();
  const kebab = latin.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return kebab.slice(0, 80).replace(/-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return (
    slug.length > 0 &&
    slug.length <= 80 &&
    /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) &&
    !RESERVED_SLUGS.includes(slug)
  );
}

/** True, якщо slug уже зайнятий TSX-статтею блогу (src/content/blog) — для Post ці слаги теж зарезервовані. */
export function isTsxBlogSlug(slug: string): boolean {
  return getAllPosts().some((post) => post.slug === slug);
}
