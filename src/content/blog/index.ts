import type { BlogPost, BlogPostSummary } from "./types";

export type { BlogPostSummary } from "./types";
import { howToReadChartPost } from "./posts/how-to-read-knitting-chart";
import { fairIsleJacquardPost } from "./posts/fair-isle-jacquard-charts";
import { createChartOnlinePost } from "./posts/create-knitting-chart-online";
import { howToReadChartEnPost } from "./posts/how-to-read-a-knitting-chart";
import { fairIsleColorworkEnPost } from "./posts/fair-isle-colorwork-charts";
import { chartMakerOnlineEnPost } from "./posts/knitting-chart-maker-online";
import { knittingChartSymbolsPost } from "./posts/knitting-chart-symbols";
import { cableKnittingChartsPost } from "./posts/cable-knitting-charts";
import { laceKnittingChartsPost } from "./posts/lace-knitting-charts";
import { knittingChartSymbolsExplainedPost } from "./posts/knitting-chart-symbols-explained";

const posts: BlogPost[] = [
  howToReadChartPost,
  fairIsleJacquardPost,
  createChartOnlinePost,
  knittingChartSymbolsPost,
  cableKnittingChartsPost,
  laceKnittingChartsPost,
  howToReadChartEnPost,
  fairIsleColorworkEnPost,
  chartMakerOnlineEnPost,
  knittingChartSymbolsExplainedPost
];

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
  const back = posts.find((p) => p.translationOf === post.slug);
  if (back) {
    result[back.lang] = back.slug;
  }
  return result;
}
