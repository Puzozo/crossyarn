"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import type { BlogPostSummary } from "@/content/blog";

export function BlogList({ posts }: { posts: BlogPostSummary[] }) {
  const { t, lang } = useTranslation();

  const filtered = posts.filter((p) => p.lang === lang);
  const shown = filtered.length > 0 ? filtered : posts;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-yarn-charcoal">{t("blog.title")}</h1>
      <p className="mt-2 text-sm text-yarn-warm-gray">{t("blog.intro")}</p>

      {posts.length === 0 ? (
        <p className="mt-8 text-sm text-yarn-warm-gray">{t("blog.empty")}</p>
      ) : (
        <div className="mt-8 space-y-6">
          {shown.map((post) => (
            <article key={post.slug} className="border-b border-yarn-sand/50 pb-6">
              <Link href={`/blog/${post.slug}`} className="group">
                <h2 className="font-display text-xl font-semibold text-yarn-charcoal group-hover:text-yarn-terracotta transition-colors">
                  {post.heading}
                </h2>
              </Link>
              <time
                dateTime={post.date}
                className="mt-1 block text-xs text-yarn-warm-gray/80"
              >
                {new Date(post.date).toLocaleDateString(
                  lang === "en" ? "en-US" : "uk-UA",
                  {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }
                )}
              </time>
              <p className="mt-2 text-sm leading-relaxed text-yarn-warm-gray">{post.description}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
