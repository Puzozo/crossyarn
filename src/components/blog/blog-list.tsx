"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import type { BlogPostSummary } from "@/content/blog";
import { MediaImage } from "@/components/content/media-image";

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
            <article key={post.slug} className="flex gap-4 border-b border-yarn-sand/50 pb-6">
              {post.coverAssetId ? (
                <Link href={`/blog/${post.slug}`} className="shrink-0">
                  <MediaImage
                    assetId={post.coverAssetId}
                    alt={post.coverAlt || post.heading}
                    width={96}
                    height={72}
                    sizes="96px"
                    className="h-[72px] w-24 rounded-lg object-cover"
                  />
                </Link>
              ) : null}
              <div className="min-w-0 flex-1">
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
                    post.lang === "en" ? "en-US" : "uk-UA",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </time>
                <p className="mt-2 text-sm leading-relaxed text-yarn-warm-gray">{post.description}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
