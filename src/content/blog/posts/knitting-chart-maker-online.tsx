import Link from "next/link";
import type { BlogPost } from "../types";

export const chartMakerOnlineEnPost: BlogPost = {
  slug: "knitting-chart-maker-online",
  title: "Knitting Chart Maker Online: Create a Chart Free",
  heading: "How to create a knitting chart online",
  description:
    "Step by step: draw a grid, paint symbols and colors, save repeats, and export to PDF. A free online knitting chart maker, start to finish.",
  date: "2026-10-28",
  lang: "en",
  translationOf: "create-knitting-chart-online",
  tags: ["editor", "tools"],
  body: (
    <>
      <p>
        Drawing your own chart no longer means sitting with graph paper and an eraser. An online
        chart maker does everything a sheet of paper does, without the hand-drawn mistakes: an even
        grid, exact row numbers, and the freedom to undo anything with a single Ctrl+Z. This is a
        step-by-step guide to creating a knitting chart online in Crossyarn, from a blank grid to a
        finished PDF.
      </p>

      <h2>Why digitize a chart (storage, editing, printing)</h2>
      <p>
        A paper chart has three weak spots: it is easy to lose, awkward to edit (every corrected
        cell is a new smudge of eraser), and hard to reprint cleanly for several projects at once.
      </p>
      <p>An online editor solves all three at the same time:</p>
      <ul>
        <li>
          <strong>Storage</strong> — the chart lives in your account, available from any device, so
          there is nothing to &ldquo;leave at home&rdquo;.
        </li>
        <li>
          <strong>Editing</strong> — want to resize the motif or fix one stitch six months later?
          Open it and adjust, instead of redrawing from scratch.
        </li>
        <li>
          <strong>Printing</strong> — the same digital chart turns into a tidy printed page and a PDF
          for your archive, with no loss of quality.
        </li>
      </ul>
      <p>
        A Crossyarn account is free, so you can digitize your first chart right now —{" "}
        <Link href="/patterns">open the editor</Link>.
      </p>

      <h2>Step 1. Create a grid of the right size</h2>
      <p>
        Every knitting chart begins with a grid — the number of stitches across and rows up. In the
        editor these are the <strong>Width × Height</strong> fields: type a number and you get an
        empty canvas of the right size.
      </p>
      <p>
        If it turns out mid-way that the size is wrong, there is no need to start over. Every one of
        the four grid edges has <strong>+/−</strong> buttons that add or remove a row or column
        exactly where you need it: widen the motif on the right, drop a spare row at the bottom. The
        minimum is 1×1, so you can narrow a chart down to any size you need.
      </p>

      <h2>Step 2. Paint with symbols and colors</h2>
      <p>
        Once the grid is ready, drawing the chart is just a click on a cell. The side panel holds the
        palette: pick a stitch symbol (knit, purl, yarn over, a crossing, and so on) and a colour,
        then paint the grid cell by cell.
      </p>
      <p>
        Everything supports <strong>undo/redo</strong> (Ctrl+Z / Ctrl+Y), so experimenting with a
        motif is risk-free — you can always step back. Your work saves automatically; there is no
        &ldquo;Save now&rdquo; button, changes are recorded as you draw.
      </p>
      <p>
        For faster drawing there are shortcuts: the number keys <strong>1–9</strong> instantly pick
        the matching palette symbol, and <strong>+/−</strong> or Ctrl+scroll zoom the grid from 40%
        to 250% — handy both for an overview of the whole piece and for aiming at a single small
        cell.
      </p>

      <h3>Symbol palette and bucket fill</h3>
      <p>
        When a chart has large plain areas — a sweater background, a solid panel of stockinette —
        painting cell by cell is slow. That is what <strong>bucket fill</strong> is for: press{" "}
        <strong>F</strong>, click a cell, and the editor floods the whole connected region of cells
        sharing that symbol and colour with the one you have selected.
      </p>
      <p>
        Fill works over a 4-connected area (neighbours above, below, left, and right), and multi-cell
        symbols act as a barrier — the fill does not leak through them or replace them by accident.
        Esc leaves fill mode at any time.
      </p>

      <h3>Multi-cell symbols</h3>
      <p>
        Some knitting elements — large cables, bold motifs, intricate colorwork blocks — make more
        sense as a block than as a single cell. The editor supports symbols up to{" "}
        <strong>20×20 cells</strong>: such a symbol occupies its area of the grid as one piece and
        does not fall apart when you copy or paste it.
      </p>
      <p>
        For your own notation you can{" "}
        <Link href="/account">upload a custom symbol</Link> in your profile (an image up to 300 KB,
        sizes 1×1 to 20×20) — useful when your chart needs marks that are not in the default palette.
      </p>

      <h2>Step 3. Repeats — repeating motifs</h2>
      <p>
        If a motif repeats across the whole piece — a cable, a leaf, a geometric colorwork element —
        there is no sense in drawing it by hand each time. Select the area of the grid that holds the
        motif, save it as a <strong>named repeat</strong>, and insert it anywhere in the chart with a
        single click.
      </p>
      <p>
        On insertion you get <strong>four mirror variants</strong>: as-is, horizontal, vertical, or
        both at once — handy for making one saved motif &ldquo;face&rdquo; different ways on
        symmetrical sections (the mirrored sleeves of a sweater, for example). If a repeat lands near
        the edge of the grid, it clips automatically and never spills past the canvas.
      </p>

      <h2>Step 4. Skipping purl rows and numbering</h2>
      <p>
        In flat knitting the wrong-side rows often just purl back the previous right-side row, so
        showing them on the chart is extra strain on the eye. The{" "}
        <strong>skip purl rows</strong> view hides the even rows and renumbers the visible ones as 1,
        3, 5… — exactly the convention of traditional printed charts.
      </p>
      <p>
        The view is consistent everywhere: in the editor as you draw, on the print page, and in the
        SVG/PDF export. So if you turn on skip-purl-rows while working, the final printout is compact
        too — no extra rows, and the numbering is right.
      </p>

      <h2>Step 5. Export to PDF/SVG and printing</h2>
      <p>You can output a finished chart in three ways:</p>
      <ol>
        <li>
          <strong>Browser print</strong> — open the print page and the chart adapts to the sheet,
          multi-cell symbols included.
        </li>
        <li>
          <strong>SVG export</strong> — a vector file with a legend that lists only the symbols
          actually used in your chart (not the whole set of available marks).
        </li>
        <li>
          <strong>PDF download</strong> — that same vector chart is rasterized into an image and
          embedded in a PDF, so the title and labels render correctly whatever the alphabet.
        </li>
      </ol>
      <p>
        All three use the same source chart, so the printed sheet, the SVG for your portfolio, and
        the PDF for your archive always look the same.
      </p>

      <h2>Step 6. Publishing and privacy (PRIVATE / UNLISTED / PUBLIC)</h2>
      <p>
        A chart you create is visible only to you by default. When you do want to share it, there are
        three levels of visibility:
      </p>
      <ul>
        <li>
          <strong>PRIVATE</strong> — only you can see it; no one else opens it even with a direct
          link.
        </li>
        <li>
          <strong>UNLISTED</strong> — reachable by link (for a workshop group or friends, say) but
          not indexed by search engines and not shown in the catalog.
        </li>
        <li>
          <strong>PUBLIC</strong> — indexed by Google, listed in{" "}
          <Link href="/explore">the pattern catalog</Link> and on your public author profile.
        </li>
      </ul>
      <p>
        You switch the level at any time on the pattern page — nothing to delete and recreate if you
        decide to make a private chart public, or the other way round.
      </p>

      <h2>What to read next</h2>
      <ul>
        <li>
          <Link href="/blog/how-to-read-a-knitting-chart">How to read a knitting chart</Link> — if
          you draw charts confidently but still read other people&apos;s with a few stumbles.
        </li>
        <li>
          <Link href="/blog/fair-isle-colorwork-charts">Fair isle and colorwork charts</Link> — when
          you are ready to move from single-colour charts to colour motifs.
        </li>
      </ul>
    </>
  )
};
