import type { BlogPost } from "./types";
import { welcomePost } from "./posts/welcome";

const posts: BlogPost[] = [welcomePost];

/** Усі статті, найновіші першими (сортування за полем date, ISO-рядок). */
export function getAllPosts(): BlogPost[] {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}

/** Стаття за slug або undefined, якщо такої немає. */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}
