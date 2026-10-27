import type { BlogPost } from "./types";
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
