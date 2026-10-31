import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug, getPostTranslations } from "@/content/blog";
import { SITE_URL } from "@/lib/site";
import { db } from "@/lib/db";
import { translate, type Language } from "@/lib/i18n/translations";
import { buildContentMetadata } from "@/lib/seo/content-metadata";
import { parseStoredContent } from "@/lib/content/repo-shared";
import { ContentRenderer } from "@/components/content/content-renderer";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export const dynamicParams = true;
export const revalidate = 3600;

async function loadDbPost(slug: string) {
  const post = await db.post.findUnique({ where: { slug } });
  if (!post || post.status !== "PUBLISHED") return null;
  return post;
}

/** Translation link for a DB post — target may be a TSX article or another DB post, either direction. */
async function resolveDbPostTranslation(post: {
  slug: string;
  translationOf: string | null;
}): Promise<{ lang: Language; path: string } | null> {
  if (post.translationOf) {
    const tsxTarget = getPostBySlug(post.translationOf);
    if (tsxTarget) return { lang: tsxTarget.lang, path: `/blog/${tsxTarget.slug}` };
    const dbTarget = await db.post.findUnique({
      where: { slug: post.translationOf },
      select: { slug: true, lang: true, status: true }
    });
    if (dbTarget && dbTarget.status === "PUBLISHED") {
      return { lang: dbTarget.lang as Language, path: `/blog/${dbTarget.slug}` };
    }
  }

  const tsxBack = getAllPosts().find((p) => p.translationOf === post.slug);
  if (tsxBack) return { lang: tsxBack.lang, path: `/blog/${tsxBack.slug}` };

  const dbBack = await db.post.findFirst({
    where: { translationOf: post.slug, status: "PUBLISHED" },
    select: { slug: true, lang: true }
  });
  if (dbBack) return { lang: dbBack.lang as Language, path: `/blog/${dbBack.slug}` };

  return null;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  const tsxPost = getPostBySlug(slug);
  if (tsxPost) {
    const langs = getPostTranslations(tsxPost);
    const otherLang: Language = tsxPost.lang === "uk" ? "en" : "uk";
    const otherSlug = langs[otherLang];
    const translation = otherSlug ? { lang: otherLang, path: `/blog/${otherSlug}` } : null;

    return buildContentMetadata({
      path: `/blog/${tsxPost.slug}`,
      lang: tsxPost.lang,
      title: `${tsxPost.title} — Crossyarn`,
      description: tsxPost.description,
      status: "PUBLISHED",
      publishedAt: new Date(tsxPost.date),
      updatedAt: new Date(tsxPost.date),
      coverUrl: null,
      translation
    });
  }

  const post = await loadDbPost(slug);
  if (!post) return { title: "Crossyarn" };

  const translation = await resolveDbPostTranslation(post);

  return buildContentMetadata({
    path: `/blog/${post.slug}`,
    lang: post.lang as Language,
    title: `${post.title} — Crossyarn`,
    description: post.description,
    status: post.status,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    coverUrl: post.coverAssetId ? `/api/media/${post.coverAssetId}/1600` : null,
    translation
  });
}

export default async function BlogArticlePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tsxPost = getPostBySlug(slug);

  if (tsxPost) {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: tsxPost.heading,
      description: tsxPost.description,
      datePublished: tsxPost.date,
      dateModified: tsxPost.date,
      inLanguage: tsxPost.lang,
      author: { "@type": "Organization", name: "Crossyarn" },
      publisher: { "@type": "Organization", name: "Crossyarn" },
      mainEntityOfPage: `${SITE_URL}/blog/${tsxPost.slug}`
    };

    const breadcrumbJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: translate(tsxPost.lang, "masterClass.breadcrumb.home"), item: SITE_URL },
        { "@type": "ListItem", position: 2, name: translate(tsxPost.lang, "blog.title"), item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 3, name: tsxPost.heading }
      ]
    };

    return (
      <article lang={tsxPost.lang} className="mx-auto max-w-3xl">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-yarn-charcoal">
          {tsxPost.heading}
        </h1>
        <time dateTime={tsxPost.date} className="mt-2 block text-sm text-yarn-warm-gray">
          {new Date(tsxPost.date).toLocaleDateString(tsxPost.lang === "en" ? "en-US" : "uk-UA", {
            day: "numeric",
            month: "long",
            year: "numeric"
          })}
        </time>
        <div className="blog-prose mt-6">{tsxPost.body}</div>
      </article>
    );
  }

  const post = await loadDbPost(slug);
  if (!post) notFound();

  const lang = post.lang as Language;
  const doc = parseStoredContent(post.content);
  const publishedDate = post.publishedAt ?? post.updatedAt;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.heading,
    description: post.description,
    image: post.coverAssetId ? [`${SITE_URL}/api/media/${post.coverAssetId}/1600`] : undefined,
    datePublished: publishedDate.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    inLanguage: post.lang,
    author: { "@type": "Organization", name: "Crossyarn" },
    publisher: { "@type": "Organization", name: "Crossyarn" },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: translate(lang, "masterClass.breadcrumb.home"), item: SITE_URL },
      { "@type": "ListItem", position: 2, name: translate(lang, "blog.title"), item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.heading }
    ]
  };

  return (
    <article lang={post.lang} className="mx-auto max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-yarn-charcoal">
        {post.heading}
      </h1>
      <time dateTime={publishedDate.toISOString()} className="mt-2 block text-sm text-yarn-warm-gray">
        {publishedDate.toLocaleDateString(lang === "en" ? "en-US" : "uk-UA", {
          day: "numeric",
          month: "long",
          year: "numeric"
        })}
      </time>
      <div className="mt-6">
        <ContentRenderer doc={doc} lang={lang} />
      </div>
    </article>
  );
}
