import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import { SITE_URL } from "@/lib/site";
import { parseTags } from "@/lib/utils";
import { Language, TranslationKey, translate } from "@/lib/i18n/translations";
import { canAccessMasterClass, gateContent } from "@/lib/content/gate";
import { parseStoredContent } from "@/lib/content/repo-shared";
import { materialsSchema, DEFAULT_MATERIALS, type Materials } from "@/lib/content/materials";
import { gallerySchema, type GalleryItem } from "@/lib/content/gallery";
import { ContentRenderer } from "@/components/content/content-renderer";
import { GalleryGrid } from "@/components/content/gallery-grid";
import { LockedContentCta } from "@/components/content/locked-content-cta";
import { Button } from "@/components/ui/button";

export type MasterClassViewData = {
  id: string;
  slug: string;
  lang: string;
  title: string;
  summary: string;
  coverAssetId: string | null;
  coverAlt: string;
  difficulty: string;
  durationMinutes: number | null;
  mainPatternId: string | null;
  materials: string;
  gallery: string;
  tags: string;
  content: string;
  priceUah: number | null;
  previewBlockCount: number;
  publishedAt: Date | null;
  updatedAt: Date;
  translationOf: { slug: string; lang: string; status: string } | null;
};

function parseMaterials(raw: string): Materials {
  try {
    return materialsSchema.parse(JSON.parse(raw));
  } catch {
    return DEFAULT_MATERIALS;
  }
}

function parseGallery(raw: string): GalleryItem[] {
  try {
    return gallerySchema.parse(JSON.parse(raw));
  } catch {
    return [];
  }
}

const DIFFICULTY_KEYS: Record<string, TranslationKey> = {
  BEGINNER: "masterClass.difficulty.BEGINNER",
  INTERMEDIATE: "masterClass.difficulty.INTERMEDIATE",
  ADVANCED: "masterClass.difficulty.ADVANCED"
};

const TRANSLATION_LABEL_KEYS: Record<Language, TranslationKey> = {
  uk: "masterClass.translation.uk",
  en: "masterClass.translation.en"
};

export async function MasterClassView({
  mc,
  preview = false
}: {
  mc: MasterClassViewData;
  preview?: boolean;
}) {
  const lang = mc.lang as Language;

  const [session, mainPattern] = await Promise.all([
    preview ? Promise.resolve(null) : getSession(),
    mc.mainPatternId
      ? db.pattern.findFirst({
          where: { id: mc.mainPatternId, visibility: { in: ["PUBLIC", "UNLISTED"] } },
          select: { id: true, title: true, width: true, height: true, updatedAt: true }
        })
      : Promise.resolve(null)
  ]);

  const isAdmin = session
    ? Boolean((await db.user.findUnique({ where: { id: session.userId }, select: { isAdmin: true } }))?.isAdmin)
    : false;

  const hasAccess = preview || canAccessMasterClass(mc.priceUah, isAdmin);
  const fullDoc = parseStoredContent(mc.content);
  const { doc, locked } = gateContent(fullDoc, { priceUah: mc.priceUah, previewBlockCount: mc.previewBlockCount }, hasAccess);

  const materials = parseMaterials(mc.materials);
  const gallery = parseGallery(mc.gallery);
  const tags = parseTags(mc.tags);

  const translation =
    mc.translationOf && mc.translationOf.status === "PUBLISHED"
      ? { lang: mc.translationOf.lang as Language, slug: mc.translationOf.slug }
      : null;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: mc.title,
    description: mc.summary,
    image: mc.coverAssetId ? [`${SITE_URL}/api/media/${mc.coverAssetId}/1600`] : undefined,
    datePublished: mc.publishedAt?.toISOString(),
    dateModified: mc.updatedAt.toISOString(),
    inLanguage: mc.lang,
    author: { "@type": "Organization", name: "Crossyarn" },
    publisher: { "@type": "Organization", name: "Crossyarn" },
    mainEntityOfPage: `${SITE_URL}/master-classes/${mc.slug}`
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Crossyarn", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: translate(lang, "masterClass.breadcrumb.catalog"),
        item: `${SITE_URL}/master-classes`
      },
      { "@type": "ListItem", position: 3, name: mc.title }
    ]
  };

  return (
    <article lang={mc.lang} className="mx-auto max-w-3xl space-y-6">
      {preview ? (
        <div className="rounded-xl border border-amber-400 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {translate(lang, "masterClass.draftBanner")}
        </div>
      ) : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav className="flex items-center gap-2 text-sm text-yarn-warm-gray">
        <Link href="/" className="hover:text-yarn-charcoal transition-colors">
          {translate(lang, "masterClass.breadcrumb.home")}
        </Link>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M4 2l4 4-4 4" />
        </svg>
        <Link href="/master-classes" className="hover:text-yarn-charcoal transition-colors">
          {translate(lang, "masterClass.breadcrumb.catalog")}
        </Link>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M4 2l4 4-4 4" />
        </svg>
        <span className="text-yarn-charcoal font-medium truncate">{mc.title}</span>
      </nav>

      {mc.coverAssetId ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-yarn-sand/50 bg-white">
          <Image
            src={`/api/media/${mc.coverAssetId}/1600`}
            alt={mc.coverAlt}
            fill
            unoptimized
            priority
            className="object-cover"
          />
        </div>
      ) : null}

      <div>
        <h1 className="font-display text-3xl font-bold text-yarn-charcoal">{mc.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-yarn-warm-gray">
          <span>{translate(lang, DIFFICULTY_KEYS[mc.difficulty] ?? "masterClass.difficulty.BEGINNER")}</span>
          {mc.durationMinutes != null ? (
            <>
              <span aria-hidden>·</span>
              <span>{translate(lang, "masterClass.duration", { minutes: mc.durationMinutes })}</span>
            </>
          ) : null}
          <span aria-hidden>·</span>
          <span className="uppercase">{mc.lang}</span>
          {translation ? (
            <>
              <span aria-hidden>·</span>
              <Link
                href={`/master-classes/${translation.slug}`}
                className="font-medium text-yarn-terracotta hover:text-yarn-terracotta-hover transition-colors"
              >
                {translate(lang, TRANSLATION_LABEL_KEYS[translation.lang])}
              </Link>
            </>
          ) : null}
        </div>
        {mc.summary ? (
          <p className="mt-4 text-sm text-yarn-warm-gray leading-relaxed">{mc.summary}</p>
        ) : null}
      </div>

      {materials.yarn.length || materials.tools.length || materials.other.length ? (
        <div className="rounded-2xl bg-white/70 border border-yarn-sand/50 p-6 shadow-warm-sm">
          <h2 className="font-display text-lg font-semibold text-yarn-charcoal">
            {translate(lang, "masterClass.materials.title")}
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {materials.yarn.length ? (
              <div>
                <p className="text-xs font-medium uppercase text-yarn-warm-gray">
                  {translate(lang, "masterClass.materials.yarn")}
                </p>
                <ul className="mt-1 list-inside list-disc text-sm text-yarn-charcoal">
                  {materials.yarn.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {materials.tools.length ? (
              <div>
                <p className="text-xs font-medium uppercase text-yarn-warm-gray">
                  {translate(lang, "masterClass.materials.tools")}
                </p>
                <ul className="mt-1 list-inside list-disc text-sm text-yarn-charcoal">
                  {materials.tools.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {materials.other.length ? (
              <div>
                <p className="text-xs font-medium uppercase text-yarn-warm-gray">
                  {translate(lang, "masterClass.materials.other")}
                </p>
                <ul className="mt-1 list-inside list-disc text-sm text-yarn-charcoal">
                  {materials.other.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl bg-white/70 border border-yarn-sand/50 p-6 shadow-warm-sm">
        <h2 className="font-display text-lg font-semibold text-yarn-charcoal">
          {translate(lang, "masterClass.mainPattern.title")}
        </h2>
        {mainPattern ? (
          <Link
            href={`/p/${mainPattern.id}`}
            className="mt-3 flex items-center gap-4 rounded-xl border border-yarn-sand/40 p-3 hover:bg-yarn-cream/40 transition-colors"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-yarn-sand/40 bg-white">
              <Image
                src={`/api/patterns/${mainPattern.id}/thumbnail?v=${mainPattern.updatedAt.getTime()}`}
                alt={mainPattern.title}
                fill
                unoptimized
                className="object-contain p-1"
              />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-yarn-charcoal truncate">{mainPattern.title}</p>
              <p className="text-sm text-yarn-terracotta">{translate(lang, "masterClass.pattern.openPattern")}</p>
            </div>
          </Link>
        ) : (
          <p className="mt-3 rounded-xl border border-dashed border-yarn-sand p-4 text-center text-sm text-yarn-warm-gray">
            {translate(lang, "masterClass.pattern.unavailable")}
          </p>
        )}
      </div>

      <ContentRenderer doc={doc} lang={lang} />

      {locked ? <LockedContentCta lang={lang} /> : null}

      {gallery.length ? (
        <div>
          <h2 className="font-display text-lg font-semibold text-yarn-charcoal">
            {translate(lang, "masterClass.gallery.title")}
          </h2>
          <GalleryGrid items={gallery} lang={lang} className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3" />
        </div>
      ) : null}

      {tags.length ? (
        <div>
          <h2 className="font-display text-lg font-semibold text-yarn-charcoal">
            {translate(lang, "masterClass.tags.title")}
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-block rounded-full bg-yarn-oatmeal/60 px-3 py-1 text-xs font-medium text-yarn-warm-gray"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <Link href="/master-classes">
          <Button variant="secondary">{translate(lang, "masterClass.breadcrumb.catalog")}</Button>
        </Link>
      </div>
    </article>
  );
}
