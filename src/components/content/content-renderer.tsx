import { db } from "@/lib/db";
import { Language, translate } from "@/lib/i18n/translations";
import { MediaImage } from "@/components/content/media-image";
import { YouTubeFacade } from "@/components/content/youtube-facade";
import { GalleryGrid } from "@/components/content/gallery-grid";
import type { ContentDoc, TopLevelBlock, InlineNode, TextNode, TextMark } from "@/lib/content/types";

type ContentRendererProps = { doc: ContentDoc; lang: Language };

type PatternSummary = { id: string; title: string };

type RenderContext = {
  lang: Language;
  patternById: Map<string, PatternSummary>;
  nextStepNumber: () => number;
};

export async function ContentRenderer({ doc, lang }: ContentRendererProps) {
  const patternIds = [
    ...new Set(
      doc.content
        .filter((b) => b.type === "patternEmbed")
        .map((b) => (b as { attrs: { patternId: string } }).attrs.patternId)
    ),
  ];
  const patterns = patternIds.length
    ? await db.pattern.findMany({
        where: { id: { in: patternIds }, visibility: { in: ["PUBLIC", "UNLISTED"] } },
        select: { id: true, title: true },
      })
    : [];
  const patternById = new Map(patterns.map((p) => [p.id, p]));

  let stepCounter = 0;
  const ctx: RenderContext = { lang, patternById, nextStepNumber: () => ++stepCounter };

  return (
    <div className="blog-prose">
      {doc.content.map((block, i) => renderBlock(block, i, ctx))}
    </div>
  );
}

function renderBlock(block: TopLevelBlock, key: React.Key, ctx: RenderContext): React.ReactNode {
  switch (block.type) {
    case "paragraph":
      return <p key={key}>{renderInline(block.content)}</p>;
    case "heading":
      return block.attrs.level === 2 ? (
        <h2 key={key}>{renderInline(block.content)}</h2>
      ) : (
        <h3 key={key}>{renderInline(block.content)}</h3>
      );
    case "bulletList":
      return (
        <ul key={key}>
          {block.content.map((li, j) => (
            <li key={j}>{li.content.map((c, k) => renderBlock(c, k, ctx))}</li>
          ))}
        </ul>
      );
    case "orderedList":
      return (
        <ol key={key}>
          {block.content.map((li, j) => (
            <li key={j}>{li.content.map((c, k) => renderBlock(c, k, ctx))}</li>
          ))}
        </ol>
      );
    case "blockquote":
      return (
        <blockquote key={key}>
          {block.content.map((p, j) => (
            <p key={j}>{renderInline(p.content)}</p>
          ))}
        </blockquote>
      );
    case "image":
      return (
        <figure key={key}>
          <MediaImage assetId={block.attrs.assetId} alt={block.attrs.alt} sizes="(min-width: 768px) 700px, 100vw" />
          {block.attrs.caption && <figcaption>{block.attrs.caption}</figcaption>}
        </figure>
      );
    case "patternImage":
      return (
        <figure key={key} className="relative">
          <MediaImage assetId={block.attrs.assetId} alt={block.attrs.alt} sizes="(min-width: 768px) 700px, 100vw" />
          <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs text-white">
            {schemeLabel(ctx.lang)}
          </span>
          {block.attrs.caption && <figcaption>{block.attrs.caption}</figcaption>}
        </figure>
      );
    case "gallery":
      return (
        <GalleryGrid
          key={key}
          items={block.attrs.items}
          lang={ctx.lang}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
          thumbClassName="relative aspect-square overflow-hidden rounded-lg border-none bg-transparent cursor-pointer"
        />
      );
    case "step": {
      const n = ctx.nextStepNumber();
      const stepLabel = translate(ctx.lang, "masterClass.step", { number: n });
      return (
        <div key={key} className="my-4 rounded-lg border border-yarn-sand p-4">
          <h3 className="font-semibold">{stepLabel}: {block.attrs.title}</h3>
          <div className="mt-2">{block.content.map((c, j) => renderBlock(c, j, ctx))}</div>
        </div>
      );
    }
    case "patternEmbed": {
      const p = ctx.patternById.get(block.attrs.patternId);
      if (p) {
        return (
          <a key={key} href={`/p/${p.id}`} className="my-4 block rounded-lg border border-yarn-sand p-4 hover:bg-yarn-cream/40">
            <span className="text-xs uppercase text-yarn-warm-gray">{schemeLabel(ctx.lang)}</span>
            <span className="block font-medium">{p.title}</span>
            <span className="text-sm text-yarn-terracotta">{openPatternLabel(ctx.lang)}</span>
          </a>
        );
      }
      return (
        <div key={key} className="my-4 rounded-lg border border-dashed border-yarn-sand p-4 text-center text-yarn-warm-gray">
          {unavailableLabel(ctx.lang)}
        </div>
      );
    }
    case "video":
      return <YouTubeFacade key={key} videoId={block.attrs.videoId} title={block.attrs.title} lang={ctx.lang} />;
    default:
      return null;
  }
}

function schemeLabel(lang: Language): string {
  return translate(lang, "masterClass.schemeLabel");
}

function openPatternLabel(lang: Language): string {
  return translate(lang, "masterClass.pattern.openPattern");
}

function unavailableLabel(lang: Language): string {
  return translate(lang, "masterClass.pattern.unavailable");
}

function renderInline(nodes?: InlineNode[]): React.ReactNode {
  return (nodes ?? []).map((node, j) => {
    switch (node.type) {
      case "hardBreak":
        return <br key={j} />;
      case "text":
        return renderTextNode(node, j);
      default:
        return null;
    }
  });
}

function renderTextNode(node: TextNode, key: React.Key): React.ReactNode {
  let content: React.ReactNode = node.text;
  const marks: TextMark[] = node.marks ?? [];
  for (const mark of marks) {
    switch (mark.type) {
      case "bold":
        content = <strong>{content}</strong>;
        break;
      case "italic":
        content = <em>{content}</em>;
        break;
      case "link":
        if (mark.attrs.href.startsWith("http")) {
          content = (
            <a href={mark.attrs.href} target="_blank" rel="noopener noreferrer">
              {content}
            </a>
          );
        } else {
          content = <a href={mark.attrs.href}>{content}</a>;
        }
        break;
    }
  }
  return <span key={key}>{content}</span>;
}