import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private/authed areas and machine endpoints. Thumbnails of public
        // patterns stay crawlable so image search can pick them up.
        disallow: [
          "/admin",
          "/account",
          "/patterns",
          "/editor/",
          "/imports/",
          "/api/",
          "/sign-in",
          "/sign-up"
        ]
      },
      { userAgent: "*", allow: "/api/patterns/*/thumbnail" }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`
  };
}
