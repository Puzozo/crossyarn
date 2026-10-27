import type { BlogPost } from "./types";
import { howToReadChartPost } from "./posts/how-to-read-knitting-chart";

const posts: BlogPost[] = [howToReadChartPost];

/** Усі статті, найновіші першими (сортування за полем date, ISO-рядок). */
export function getAllPosts(): BlogPost[] {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}

/** Стаття за slug або undefined, якщо такої немає. */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}
