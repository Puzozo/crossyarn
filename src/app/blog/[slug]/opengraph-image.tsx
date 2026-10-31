import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { getPostBySlug } from "@/content/blog";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Стаття блогу Crossyarn";

// The deploy copies public/ next to the standalone server and server.js
// chdirs there, so process.cwd()/public resolves in dev and prod alike.
const FONT_PATH = path.join(process.cwd(), "public", "fonts", "NotoSans-SemiBold.ttf");

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let title: string | null = getPostBySlug(slug)?.title ?? null;
  if (!title) {
    const post = await db.post.findUnique({
      where: { slug },
      select: { title: true, status: true }
    });
    if (!post || post.status !== "PUBLISHED") {
      return new Response("Not found", { status: 404 });
    }
    title = post.title;
  }
  if (!title) {
    return new Response("Not found", { status: 404 });
  }

  // Missing font must not break link previews — fall back to a text-free card.
  let fontData: Buffer | null = null;
  try {
    fontData = await readFile(FONT_PATH);
  } catch {
    fontData = null;
  }

  const displayTitle = title.length > 70 ? `${title.slice(0, 69)}…` : title;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f1e8",
          padding: "64px",
          gap: "24px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <svg width="44" height="44" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="12" stroke="#c46a4f" strokeWidth="2" />
            <path
              d="M8 14c0-3.3 2.7-6 6-6s6 2.7 6 6-2.7 6-6 6"
              stroke="#c46a4f"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M11 14c0-1.7 1.3-3 3-3s3 1.3 3 3"
              stroke="#c46a4f"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          {fontData ? (
            <div style={{ display: "flex", fontSize: "34px", color: "#3d3833" }}>Crossyarn</div>
          ) : null}
        </div>
        {fontData ? (
          <div
            style={{
              display: "flex",
              fontSize: "52px",
              lineHeight: 1.2,
              color: "#3d3833",
              textAlign: "center",
              maxWidth: "1000px"
            }}
          >
            {displayTitle}
          </div>
        ) : null}
        {fontData ? (
          <div style={{ display: "flex", fontSize: "28px", color: "#8a7f70" }}>
            crossyarn.online
          </div>
        ) : null}
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: "Noto Sans", data: fontData, style: "normal" as const, weight: 600 as const }]
        : undefined
    }
  );
}
