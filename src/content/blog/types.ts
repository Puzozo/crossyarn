import type { ReactNode } from "react";

export type BlogPost = {
  /** URL-slug: малі латинські літери, kebab-case; незмінний після публікації. */
  slug: string;
  /** SEO-заголовок БЕЗ суфікса " — Crossyarn" (його додає сторінка). ≤60 симв. */
  title: string;
  /** H1 на сторінці статті. */
  heading: string;
  /** Meta description, ≤155 симв. */
  description: string;
  /** Дата у форматі ISO "РРРР-ММ-ДД" — дата публікації/оновлення. */
  date: string;
  /** Теги / мітки кластера. */
  tags: string[];
  /** Тіло статті як JSX (рендериться всередині .blog-prose). */
  body: ReactNode;
};
