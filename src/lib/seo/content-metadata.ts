import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import type { Language } from "@/lib/i18n/translations";

export type ContentMetadataInput = {
  path: string;
  lang: Language;
  title: string;
  description: string;
  status: "DRAFT" | "PUBLISHED" | "PENDING_REVIEW" | "REJECTED";
  publishedAt: Date | null;
  updatedAt: Date;
  coverUrl: string | null;
  translation: { lang: Language; path: string } | null;
};

const abs = (path: string) => `${SITE_URL}${path}`;

export function buildContentMetadata(input: ContentMetadataInput): Metadata {
  const languages: Record<string, string> = {
    [input.lang]: abs(input.path)
  };
  if (input.translation) {
    languages[input.translation.lang] = abs(input.translation.path);
  }

  const langs = input.translation
    ? [input.lang, input.translation.lang]
    : [input.lang];
  let xDefaultPath = input.path;
  if (langs.includes("en")) {
    if (input.lang === "en") {
      xDefaultPath = input.path;
    } else if (input.translation) {
      xDefaultPath = input.translation.path;
    }
  }
  languages["x-default"] = abs(xDefaultPath);

  const openGraph: Metadata["openGraph"] = {
    type: "article",
    title: input.title,
    description: input.description,
    url: input.path,
    locale: input.lang === "en" ? "en_US" : "uk_UA",
    publishedTime: input.publishedAt ? input.publishedAt.toISOString() : undefined,
    modifiedTime: input.updatedAt.toISOString()
  };
  const twitter: Metadata["twitter"] = {
    card: "summary_large_image",
    title: input.title,
    description: input.description
  };
  if (input.coverUrl) {
    openGraph.images = [{ url: input.coverUrl, width: 1200 }];
    twitter.images = [input.coverUrl];
  }

  const metadata: Metadata = {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: input.path,
      languages
    },
    openGraph,
    twitter
  };

  if (input.status !== "PUBLISHED") {
    metadata.robots = { index: false, follow: false };
  }

  return metadata;
}