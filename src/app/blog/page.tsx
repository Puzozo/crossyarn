import type { Metadata } from "next";
import { getPostSummaries } from "@/content/blog";
import { BlogList } from "@/components/blog/blog-list";

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
  return <BlogList posts={getPostSummaries()} />;
}
