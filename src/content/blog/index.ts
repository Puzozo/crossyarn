import type { BlogPost, BlogPostSummary } from "./types";

export type { BlogPostSummary } from "./types";
import { howToReadChartPost } from "./posts/how-to-read-knitting-chart";
import { fairIsleJacquardPost } from "./posts/fair-isle-jacquard-charts";
import { createChartOnlinePost } from "./posts/create-knitting-chart-online";

const posts: BlogPost[] = [howToReadChartPost, fairIsleJacquardPost, createChartOnlinePost];

/** Усі статті, найновіші першими (сортування за полем date, ISO-рядок). */
export function getAllPosts(): BlogPost[] {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}

/** Стаття за slug або undefined, якщо такої немає. */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}

/** Статті без тіла, найновіші першими (як getAllPosts) — для серіалізації в клієнт. */
export function getPostSummaries(): BlogPostSummary[] {
  return getAllPosts().map(({ body, ...rest }) => {
    void body;
    return rest;
  });
}

/** Мапа «мова → slug»: власна мова статті + пара за translationOf, якщо така існує. */
export function getPostTranslations(post: BlogPost): { uk?: string; en?: string } {
  const result: { uk?: string; en?: string } = { [post.lang]: post.slug };
  if (post.translationOf) {
    const other = posts.find((p) => p.slug === post.translationOf);
    if (other) {
      result[other.lang] = other.slug;
    }
  }
  return result;
}
