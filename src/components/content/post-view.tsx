import { SITE_URL } from "@/lib/site";
import { translate, type Language } from "@/lib/i18n/translations";
import { parseStoredContent } from "@/lib/content/repo-shared";
import { ContentRenderer } from "@/components/content/content-renderer";

export type PostViewData = {
  slug: string;
  lang: string;
  heading: string;
  description: string;
  content: string;
  coverAssetId: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
};

export function PostView({ post, preview = false }: { post: PostViewData; preview?: boolean }) {
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
      {preview ? (
        <div className="mb-6 rounded-xl border border-amber-400 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {translate(lang, "masterClass.draftBanner")}
        </div>
      ) : null}
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
