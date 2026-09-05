import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { patternToThumbnailSvg } from "@/lib/export/pattern-thumbnail";
import { PatternDocument } from "@/lib/patterns/model";
import { hydrateBuiltinSymbols } from "@/lib/patterns/normalize-symbols";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Прев'ю схеми в'язання на Crossyarn";

/**
 * PNG og:image for /p/[id] — social networks don't rasterize SVG, so the link
 * preview needs a real bitmap. The pattern grid is rendered by the existing
 * thumbnail SVG (in font-free "dot" glyph mode, since satori's rasterizer has
 * no fonts for nested <text>) and embedded as a data URI.
 *
 * PRIVATE patterns always 404 here: crawlers carry no session, and the page
 * itself is invisible to everyone but the owner anyway.
 */

// The deploy copies public/ next to the standalone server and server.js
// chdirs there, so process.cwd()/public resolves in dev and prod alike.
const FONT_PATH = path.join(process.cwd(), "public", "fonts", "NotoSans-SemiBold.ttf");

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pattern = await db.pattern.findUnique({
    where: { id },
    select: { title: true, width: true, height: true, visibility: true, patternData: true }
  });
  if (!pattern || pattern.visibility === "PRIVATE") {
    return new Response("Not found", { status: 404 });
  }

  const svg = patternToThumbnailSvg(
    hydrateBuiltinSymbols(pattern.patternData as unknown as PatternDocument),
    { glyphs: "dot" }
  );
  const svgDataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  // Missing font must not break link previews — fall back to a text-free card.
  let fontData: Buffer | null = null;
  try {
    fontData = await readFile(FONT_PATH);
  } catch {
    fontData = null;
  }

  const title = pattern.title.length > 55 ? `${pattern.title.slice(0, 54)}…` : pattern.title;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "#f7f1e8",
          padding: "48px",
          gap: "48px"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "534px",
            height: "534px",
            background: "#ffffff",
            borderRadius: "24px",
            border: "1px solid #e6dac8",
            padding: "16px",
            flexShrink: 0
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={svgDataUri}
            alt=""
            style={{ maxWidth: "502px", maxHeight: "502px", objectFit: "contain" }}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: "522px",
            height: "100%",
            gap: "24px",
            overflow: "hidden"
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
                fontSize: "56px",
                lineHeight: 1.15,
                color: "#3d3833",
                wordBreak: "break-word"
              }}
            >
              {title}
            </div>
          ) : null}
          {fontData ? (
            <div style={{ display: "flex", fontSize: "30px", color: "#8a7f70" }}>
              {pattern.width} × {pattern.height} · crossyarn.online
            </div>
          ) : null}
        </div>
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
