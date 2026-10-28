import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "../types";
import { BUILTIN_ICONS } from "@/lib/patterns/builtin-icons";

export const knittingChartSymbolsExplainedPost: BlogPost = {
  slug: "knitting-chart-symbols-explained",
  title: "Knitting Chart Symbols Explained: A Complete Guide",
  heading: "Knitting Chart Symbols Explained: A Complete Glossary",
  description:
    "A complete guide to knitting chart symbols: all 28 symbols used by the Crossyarn editor, explained one by one with a direct anchor to each.",
  date: "2026-10-28",
  lang: "en",
  translationOf: "knitting-chart-symbols",
  tags: ["basics", "symbols", "reference"],
  body: (
    <>
      <p>
        A knitting chart turns a whole pattern into a compact grid of little squares, each one
        standing for a single stitch. The symbols inside those squares are the instructions:
        knit, purl, make a yarn over, cross two stitches, or close off an increase. If you can
        read the symbols, you can read the pattern, so learning what each one means is the
        single most useful step in following any chart. This glossary collects all 28 symbols
        that the Crossyarn editor draws, with a short note on what each one does.
      </p>
      <p>
        Every symbol in this glossary has its own anchor, so you can link straight to a single
        one, for example from your pattern&apos;s legend or from another article. If you are
        still getting used to reading charts in the first place, start with our piece on{" "}
        <Link href="/blog/how-to-read-a-knitting-chart">How to Read a Knitting Chart</Link>, and
        keep this glossary open beside you as a quick reference.
      </p>
      <p>
        The symbols are grouped by the kind of stitch they describe, which makes it easier to
        find the one you need.
      </p>
      <h2>Basic stitches</h2>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>What it means</th>
          </tr>
        </thead>
        <tbody>
          <tr id="knit">
            <td><Image src={BUILTIN_ICONS["knit"]} alt="Knit stitch" width={24} height={24} className="object-contain" /></td>
            <td>Knit stitch</td>
            <td>The default right-side stitch of stockinette fabric, usually drawn as a vertical line or left as an empty square, the basic building block of most patterns.</td>
          </tr>
          <tr id="purl">
            <td><Image src={BUILTIN_ICONS["purl"]} alt="Purl stitch" width={24} height={24} className="object-contain" /></td>
            <td>Purl stitch</td>
            <td>The back side of a knit stitch: it shows as a raised bump or a horizontal bar on the right side of the work and is marked with a horizontal line.</td>
          </tr>
          <tr id="wrap">
            <td><Image src={BUILTIN_ICONS["wrap"]} alt="Garter stitch" width={24} height={24} className="object-contain" /></td>
            <td>Garter stitch</td>
            <td>One stitch of garter stitch (every row knit), which gives a dense, bumpy texture and even edges.</td>
          </tr>
          <tr id="five-knit">
            <td><Image src={BUILTIN_ICONS["five-knit"]} alt="Five knits" width={24} height={24} className="object-contain" /></td>
            <td>Five knits</td>
            <td>A shorthand for five knit stitches worked in a row, handy for filling wide, plain sections of the fabric.</td>
          </tr>
        </tbody>
      </table>

      <h2>Yarn overs</h2>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>What it means</th>
          </tr>
        </thead>
        <tbody>
          <tr id="yarn-over">
            <td><Image src={BUILTIN_ICONS["yarn-over"]} alt="Yarn over" width={24} height={24} className="object-contain" /></td>
            <td>Yarn over</td>
            <td>Wrapping the yarn around the needle makes an extra stitch and leaves an open hole, the foundation of every lace pattern.</td>
          </tr>
          <tr id="purl-in-yarn-over">
            <td><Image src={BUILTIN_ICONS["purl-in-yarn-over"]} alt="Purl into the yarn over" width={24} height={24} className="object-contain" /></td>
            <td>Purl into the yarn over</td>
            <td>Working the yarn over as a purl stitch untwists the loop, so the hole stays clean and even.</td>
          </tr>
        </tbody>
      </table>

      <h2>Crossed stitches</h2>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>What it means</th>
          </tr>
        </thead>
        <tbody>
          <tr id="cross-knit">
            <td><Image src={BUILTIN_ICONS["cross-knit"]} alt="Crossed knit stitch" width={24} height={24} className="object-contain" /></td>
            <td>Crossed knit stitch</td>
            <td>A knit stitch worked through the back loop, so it comes out twisted and sits a little tighter in the fabric.</td>
          </tr>
          <tr id="cross-purl">
            <td><Image src={BUILTIN_ICONS["cross-purl"]} alt="Crossed purl stitch" width={24} height={24} className="object-contain" /></td>
            <td>Crossed purl stitch</td>
            <td>A purl stitch worked through the back loop, the twisted, purl-side counterpart of the crossed knit.</td>
          </tr>
        </tbody>
      </table>
      <h2>Two-stitch decreases</h2>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>What it means</th>
          </tr>
        </thead>
        <tbody>
          <tr id="k2tog-left">
            <td><Image src={BUILTIN_ICONS["k2tog-left"]} alt="Two stitches together, leaning left" width={24} height={24} className="object-contain" /></td>
            <td>Two stitches together, leaning left</td>
            <td>Two stitches worked together so the new stitch leans to the left, the ssk decrease.</td>
          </tr>
          <tr id="k2tog-right">
            <td><Image src={BUILTIN_ICONS["k2tog-right"]} alt="Two stitches together, leaning right" width={24} height={24} className="object-contain" /></td>
            <td>Two stitches together, leaning right</td>
            <td>The classic knit-two-together, k2tog, where the new stitch leans to the right.</td>
          </tr>
          <tr id="p2tog-left">
            <td><Image src={BUILTIN_ICONS["p2tog-left"]} alt="Two purls together, leaning left" width={24} height={24} className="object-contain" /></td>
            <td>Two purls together, leaning left</td>
            <td>The purl version of the left-leaning decrease, two stitches purlled together with the stitch leaning left.</td>
          </tr>
          <tr id="p2tog-right">
            <td><Image src={BUILTIN_ICONS["p2tog-right"]} alt="Two purls together, leaning right" width={24} height={24} className="object-contain" /></td>
            <td>Two purls together, leaning right</td>
            <td>The purl version of the right-leaning decrease, two stitches purlled together with the stitch leaning right.</td>
          </tr>
        </tbody>
      </table>

      <h2>Three-stitch decreases</h2>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>What it means</th>
          </tr>
        </thead>
        <tbody>
          <tr id="k3tog">
            <td><Image src={BUILTIN_ICONS["k3tog"]} alt="Knit three together" width={24} height={24} className="object-contain" /></td>
            <td>Knit three together</td>
            <td>A double decrease, three stitches knit together, which removes two stitches at once.</td>
          </tr>
          <tr id="p3tog">
            <td><Image src={BUILTIN_ICONS["p3tog"]} alt="Purl three together" width={24} height={24} className="object-contain" /></td>
            <td>Purl three together</td>
            <td>The double decrease worked on the purl side, three stitches purlled together.</td>
          </tr>
          <tr id="k3tog-wide">
            <td><Image src={BUILTIN_ICONS["k3tog-wide"]} alt="Knit three together (wide)" width={72} height={24} className="object-contain" /></td>
            <td>Knit three together (wide)</td>
            <td>The same three-stitch knit decrease drawn across three squares, so the chart shows where those stitches come from.</td>
          </tr>
          <tr id="p3tog-wide">
            <td><Image src={BUILTIN_ICONS["p3tog-wide"]} alt="Purl three together (wide)" width={72} height={24} className="object-contain" /></td>
            <td>Purl three together (wide)</td>
            <td>The wide version of the three-stitch purl decrease, stretched across three chart squares.</td>
          </tr>
        </tbody>
      </table>

      <h2>Increases (several stitches from one)</h2>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>What it means</th>
          </tr>
        </thead>
        <tbody>
          <tr id="two-from-one">
            <td><Image src={BUILTIN_ICONS["two-from-one"]} alt="Two from one" width={24} height={24} className="object-contain" /></td>
            <td>Two from one</td>
            <td>Two stitches worked out of a single stitch, adding one stitch to widen the fabric.</td>
          </tr>
          <tr id="three-from-one">
            <td><Image src={BUILTIN_ICONS["three-from-one"]} alt="Three from one" width={24} height={24} className="object-contain" /></td>
            <td>Three from one</td>
            <td>Three stitches worked out of one, an increase of two, often the base of bobbles and leaf motifs.</td>
          </tr>
          <tr id="four-from-one">
            <td><Image src={BUILTIN_ICONS["four-from-one"]} alt="Four from one" width={24} height={24} className="object-contain" /></td>
            <td>Four from one</td>
            <td>Four stitches worked out of one, a strong local increase.</td>
          </tr>
          <tr id="five-from-one">
            <td><Image src={BUILTIN_ICONS["five-from-one"]} alt="Five from one" width={24} height={24} className="object-contain" /></td>
            <td>Five from one</td>
            <td>Five stitches worked out of one, the maximum increase, typical for dimensional, raised elements.</td>
          </tr>
        </tbody>
      </table>
      <h2>Working several together</h2>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>What it means</th>
          </tr>
        </thead>
        <tbody>
          <tr id="four-together">
            <td><Image src={BUILTIN_ICONS["four-together"]} alt="Four together" width={24} height={24} className="object-contain" /></td>
            <td>Four together</td>
            <td>Four stitches worked together into one, a decrease of three, often used to close off a bobble.</td>
          </tr>
          <tr id="five-together">
            <td><Image src={BUILTIN_ICONS["five-together"]} alt="Five together" width={24} height={24} className="object-contain" /></td>
            <td>Five together</td>
            <td>Five stitches worked together into one, closing off a dimensional element and bringing the stitch count back to where it started.</td>
          </tr>
        </tbody>
      </table>

      <h2>Slipped stitches</h2>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>What it means</th>
          </tr>
        </thead>
        <tbody>
          <tr id="slip-back">
            <td><Image src={BUILTIN_ICONS["slip-back"]} alt="Slipped stitch, yarn in back" width={24} height={24} className="object-contain" /></td>
            <td>Slipped stitch, yarn in back</td>
            <td>The stitch is slipped unworked with the working yarn held behind the work, used in dense textures and cables.</td>
          </tr>
          <tr id="slip-front">
            <td><Image src={BUILTIN_ICONS["slip-front"]} alt="Slipped stitch, yarn in front" width={24} height={24} className="object-contain" /></td>
            <td>Slipped stitch, yarn in front</td>
            <td>The stitch is slipped with the working yarn held in front of the work, leaving a horizontal float on the right side.</td>
          </tr>
        </tbody>
      </table>

      <h2>Cables (crossings)</h2>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>What it means</th>
          </tr>
        </thead>
        <tbody>
          <tr id="cable-4">
            <td><Image src={BUILTIN_ICONS["cable-4"]} alt="Cable, 4 stitches" width={96} height={24} className="object-contain" /></td>
            <td>Cable, 4 stitches</td>
            <td>A four-stitch cable crossing (two over two) worked with a cable needle; the symbol spans four chart squares.</td>
          </tr>
          <tr id="cable-6">
            <td><Image src={BUILTIN_ICONS["cable-6"]} alt="Cable, 6 stitches" width={144} height={24} className="object-contain" /></td>
            <td>Cable, 6 stitches</td>
            <td>A six-stitch cable crossing (three over three), a wider cable; the symbol spans six chart squares.</td>
          </tr>
        </tbody>
      </table>

      <h2>Other</h2>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Name</th>
            <th>What it means</th>
          </tr>
        </thead>
        <tbody>
          <tr id="bobble">
            <td><Image src={BUILTIN_ICONS["bobble"]} alt="Bobble" width={24} height={24} className="object-contain" /></td>
            <td>Bobble</td>
            <td>A raised puffy knot made from several stitches worked out of one and then closed back together, leaving a 3D dot on the fabric.</td>
          </tr>
          <tr id="empty">
            <td><Image src={BUILTIN_ICONS["empty"]} alt="Empty square" width={24} height={24} className="object-contain" /></td>
            <td>Empty square</td>
            <td>A square with no stitch to work, background, or a place that is not worked in this row of the pattern.</td>
          </tr>
        </tbody>
      </table>

      <p>
        All of these symbols are available in the{" "}
        <Link href="/patterns">Crossyarn&apos;s pattern editor</Link>: the moment you place one
        on the grid, it is added to your finished chart&apos;s legend automatically, carrying
        exactly the same name as it has in this glossary. So when you are ready to design
        your own pattern, the very same symbols you have just learned are right there, ready
        to draw with.
      </p>
    </>
  )
};
