import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/content/blog";

export const metadata: Metadata = {
  title: "Блог — Crossyarn",
  description:
    "Гайди та поради зі схем для в'язання: як читати схеми, жаккард, коси, ажур та онлайн-редактор Crossyarn.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Блог — Crossyarn",
    description: "Гайди та поради зі схем для в'язання від Crossyarn.",
    url: "/blog",
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-yarn-charcoal">Блог</h1>
      <p className="mt-2 text-sm text-yarn-warm-gray">
        Гайди та поради зі створення й читання схем для в&#39;язання.
      </p>

      {posts.length === 0 ? (
        <p className="mt-8 text-sm text-yarn-warm-gray">Поки що немає статей.</p>
      ) : (
        <div className="mt-8 space-y-6">
          {posts.map((post) => (
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
                {new Date(post.date).toLocaleDateString("uk-UA", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
              <p className="mt-2 text-sm leading-relaxed text-yarn-warm-gray">{post.description}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
