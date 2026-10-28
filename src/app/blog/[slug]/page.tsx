import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug, getPostTranslations } from "@/content/blog";
import { SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Crossyarn" };
  const langs = getPostTranslations(post);
  return {
    title: `${post.title} — Crossyarn`,
    description: post.description,
    alternates: {
      canonical: `/blog/${post.slug}`,
      ...(langs.uk && langs.en
        ? {
            languages: {
              uk: `/blog/${langs.uk}`,
              en: `/blog/${langs.en}`,
              "x-default": `/blog/${langs.uk}`
            }
          }
        : {})
    },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      publishedTime: post.date
    }
  };
}

export default async function BlogArticlePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.heading,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: "Crossyarn" },
    publisher: { "@type": "Organization", name: "Crossyarn" },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`
  };

  return (
    <article lang={post.lang} className="mx-auto max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-yarn-charcoal">
        {post.heading}
      </h1>
      <time dateTime={post.date} className="mt-2 block text-sm text-yarn-warm-gray">
        {new Date(post.date).toLocaleDateString(post.lang === "en" ? "en-US" : "uk-UA", {
          day: "numeric",
          month: "long",
          year: "numeric"
        })}
      </time>
      <div className="blog-prose mt-6">{post.body}</div>
    </article>
  );
}
