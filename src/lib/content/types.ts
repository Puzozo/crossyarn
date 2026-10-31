export type TextMark =
  | { type: "bold" }
  | { type: "italic" }
  | { type: "link"; attrs: { href: string } };

export type TextNode = { type: "text"; text: string; marks?: TextMark[] };
export type HardBreakNode = { type: "hardBreak" };
export type InlineNode = TextNode | HardBreakNode;

export type ParagraphNode = { type: "paragraph"; content?: InlineNode[] };
export type HeadingNode = { type: "heading"; attrs: { level: 2 | 3 }; content?: InlineNode[] };

export type ListItemNode = { type: "listItem"; content: (ParagraphNode | BulletListNode | OrderedListNode)[] };
export type BulletListNode = { type: "bulletList"; content: ListItemNode[] };
export type OrderedListNode = { type: "orderedList"; content: ListItemNode[] };
export type BlockquoteNode = { type: "blockquote"; content: ParagraphNode[] };

export type MediaAttrs = { assetId: string; alt: string; caption?: string };
export type ImageNode = { type: "image"; attrs: MediaAttrs };
export type PatternImageNode = { type: "patternImage"; attrs: MediaAttrs };
export type GalleryNode = { type: "gallery"; attrs: { items: MediaAttrs[] } };

export type StepContentNode = ParagraphNode | BulletListNode | OrderedListNode | ImageNode;
export type StepNode = { type: "step"; attrs: { title: string }; content: StepContentNode[] };

export type PatternEmbedNode = { type: "patternEmbed"; attrs: { patternId: string } };
export type VideoNode = { type: "video"; attrs: { provider: "youtube"; videoId: string; title?: string } };

export type TopLevelBlock =
  | ParagraphNode
  | HeadingNode
  | BulletListNode
  | OrderedListNode
  | BlockquoteNode
  | ImageNode
  | PatternImageNode
  | GalleryNode
  | StepNode
  | PatternEmbedNode
  | VideoNode;

export type ContentDoc = { type: "doc"; content: TopLevelBlock[] };
