import Link from "next/link";
import type { BlogPost } from "../types";

export const howToReadChartEnPost: BlogPost = {
  slug: "how-to-read-a-knitting-chart",
  title: "How to Read a Knitting Chart: A Beginner's Guide",
  heading: "How to Read a Knitting Chart",
  description:
    "Learn to read any knitting chart: what the symbols mean, which way to read the rows, and how a repeat works. A clear beginner's guide.",
  date: "2026-10-28",
  lang: "en",
  translationOf: "how-to-read-knitting-chart",
  tags: ["basics", "reading charts"],
  body: (
    <>
      <p>
        If you have ever cast on for a pattern, worked the first few rows of written
        instructions, and then been handed a page of tiny squares, dots, and slashes that looks
        like a maze — you are in good company. Charts are where most knitters hit their first real
        wall. The good news is that a chart is not a new language. It is a short code, and once you
        learn what a few dozen symbols mean and which way to hold the page, it becomes the fastest,
        clearest way to follow a pattern. Here is how to read your first knitting chart, from the
        ground up.
      </p>

      <h2>What a knitting chart is and what it&apos;s made of</h2>
      <p>
        A knitting chart is a visual record of your pattern, laid out as a grid. Each little square
        in that grid stands for exactly one stitch, and the symbol inside the square tells you what
        to do with it: knit it, purl it, make a yarn over, or cross it with its neighbour.
      </p>
      <p>
        Think of a chart as sheet music for your knitting. Instead of paragraphs that say
        &ldquo;Row 1: knit 2, purl 1, yarn over, repeat to end of row…&rdquo;, you get one compact
        picture where an entire row fits into a single line of squares. For anything more complex
        than stockinette, that picture is far easier to follow than a wall of words.
      </p>
      <p>
        Every chart comes with a legend — a list of the symbols used in that specific pattern, each
        with a short explanation. The legend is your map, and you should always check it before you
        start rather than relying on memory. If you want to see a real example before reading on,
        open <Link href="/explore">the pattern catalog</Link> and pick any chart. The structure — a
        grid plus a legend — is the same on every one.
      </p>

      <h2>Reading direction: rows, columns, right and wrong side</h2>
      <p>
        This is the rule that trips up most beginners, so let&apos;s get it exactly right: which way
        you read the chart depends on which side of the work you are knitting.
      </p>
      <ul>
        <li>
          <strong>Rows</strong> are numbered from the bottom of the chart up. That matches how the
          fabric actually grows on your needles — you start at the cast-on edge and work upward.
        </li>
        <li>
          <strong>Odd rows</strong> (1, 3, 5…) are usually worked on the right side of the work,
          and you read them <strong>from right to left</strong>.
        </li>
        <li>
          <strong>Even rows</strong> (2, 4, 6…) are worked on the wrong side, and you read them{" "}
          <strong>from left to right</strong>.
        </li>
      </ul>
      <p>
        This is not an arbitrary quirk. It follows directly from how knitting moves: you never turn
        the chart around, you turn the fabric in your hands. So the direction flips on every other
        row.
      </p>
      <p>
        There is one important exception: working <strong>in the round</strong> (on circular
        needles, never turning the work). In that case every row is a right-side row, so you always
        read right to left, with no back-and-forth switching at all.
      </p>
      <p>
        On Crossyarn you will sometimes see a chart that shows only the right-side rows, with the
        wrong-side rows hidden. That is the skip-purl-rows view: the row numbers run 1, 3, 5… and
        the chart gets shorter, because on most textures the hidden wrong-side rows simply purl the
        previous right-side row back.
      </p>

      <h2>Common chart symbols</h2>
      <p>
        Knitting symbols are an international system, though they vary a little from source to
        source. Learn the common set once and you will recognise them everywhere. Here are the ones
        you will meet most often.
      </p>

      <h3>Knit, purl, yarn overs</h3>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>What it means</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Empty square, or &ldquo;—&rdquo;</td>
            <td>Knit stitch</td>
          </tr>
          <tr>
            <td>Dot, &ldquo;•&rdquo;</td>
            <td>Purl stitch</td>
          </tr>
          <tr>
            <td>Circle, &ldquo;○&rdquo;</td>
            <td>Yarn over (an increase)</td>
          </tr>
          <tr>
            <td>Diagonal slash, &ldquo;/&rdquo; or &ldquo;\&rdquo;</td>
            <td>Two stitches worked together; the slant shows the lean of the decrease</td>
          </tr>
          <tr>
            <td>Triangle, &ldquo;Λ&rdquo;</td>
            <td>Decrease three stitches to one</td>
          </tr>
        </tbody>
      </table>
      <p>
        A few of these are worth saying out loud. The plain square is so common it is often left
        empty — on a mostly-knit fabric, &ldquo;nothing drawn&rdquo; usually just means
        &ldquo;knit&rdquo;. The yarn over is a free increase that opens a hole, so it shows up in
        lace and in the gaps of textured stitches. And the slant of a two-stitch decrease matters:
        it tells you whether the stitches lean left or right, which is exactly what shapes the edge
        of a motif or a cable.
      </p>

      <h3>Cables (crossings) and slipped stitches</h3>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>What it means</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Two crossing lines</td>
            <td>A cable crossing — one group of stitches passes over another</td>
          </tr>
          <tr>
            <td>Arrow over the crossing</td>
            <td>The direction of the crossing: over to the left or to the right</td>
          </tr>
          <tr>
            <td>&ldquo;V&rdquo; with a stroke</td>
            <td>A slipped stitch — moved to a cable needle without being worked</td>
          </tr>
          <tr>
            <td>Double frame around a symbol</td>
            <td>The stitch is worked through a cable needle</td>
          </tr>
        </tbody>
      </table>
      <p>
        Cables are where beginners tend to freeze, but a crossing is just a few stitches that you
        temporarily move aside and come back to. The arrow is your instruction: it shows which
        group of stitches jumps in front. Hold the slipped stitches in front of the work and the
        cable crosses to the left; hold them behind, and it crosses to the right.
      </p>
      <p>
        One caution before you rely on any chart you download: the same-looking symbol can mean
        slightly different things in different patterns. That is why the legend on your specific
        chart always outranks the general tables you have seen before. Check the legend first,
        every time.
      </p>

      <h2>What a repeat is and how to work it</h2>
      <p>
        A repeat is the smallest piece of the pattern that gets copied again and again — across the
        row, up the fabric, or both — until the whole piece is filled. Rather than drawing a chart
        that is a whole scarf or a whole sweater wide, the designer draws one repeat and tells you
        how many times to work it.
      </p>
      <p>
        On the chart, a repeat is usually boxed in or set off with a background colour, with a note
        alongside that reads something like &ldquo;repeat = 8 stitches, work X times&rdquo; or
        &ldquo;vertical repeat = 12 rows&rdquo;. To use it while you knit:
      </p>
      <ol>
        <li>Find the boxed-in section of the chart — that is your one repeat.</li>
        <li>Count how many stitches it spans across, and how many rows it is tall.</li>
        <li>
          Work the repeat from its first stitch to its last, then start again at the first stitch
          of the repeat, and keep going to the end of the row.
        </li>
        <li>
          Up the fabric, do the same: when you finish the last row of the repeat, go back to the
          first row and continue until you reach the length you need.
        </li>
      </ol>
      <p>
        Repeats are what make it possible to knit a twenty-stitch motif across a garment that is a
        hundred stitches wide. They do most of the heavy lifting in colorwork and in any pattern
        with a repeating cable.
      </p>

      <h2>How to count rows and not lose your place</h2>
      <p>
        The number one reason knitters abandon a fiddly chart is not the symbols — it is losing
        count of the row. You put the work down for a break, come back, and have no idea where you
        left off. A few small habits fix this for good:
      </p>
      <ul>
        <li>
          <strong>A row counter</strong> (a mechanical one or a plain paper tally) — turn it at the
          start of each new row, not at the end.
        </li>
        <li>
          <strong>Stitch markers</strong> placed at the edges of each repeat, so you can see at a
          glance if your stitch count has drifted.
        </li>
        <li>
          <strong>Writing your row number down</strong> — on a printed chart with a pencil, or in a
          notebook if you knit in short bursts.
        </li>
      </ul>
      <p>
        On Crossyarn, every finished pattern has a knitting mode built in. It highlights the current
        row right on the chart and lets you step forward and back with the arrow keys, so you can
        always see exactly where you stopped — even if you set the work aside for a week. It takes
        the main load off your memory: no more recounting squares by hand every time you pick the
        project back up.
      </p>

      <h2>Practice: open a finished chart and try it yourself</h2>
      <p>
        Theory sticks faster when you put it on a real example right away. Open{" "}
        <Link href="/explore">the pattern catalog</Link> and pick a simple texture with a small
        repeat — it is ideal for practising your row direction and recognising the basic symbols
        without the pressure.
      </p>
      <p>
        Work through one row at a time: name whether the row in front of you is a right-side or
        wrong-side row, find the repeat, and count its stitches. Once reading a chart starts to feel
        natural, you can move on to the next level — decoding the symbols in{" "}
        <Link href="/blog/fair-isle-colorwork-charts">fair isle and colorwork charts</Link> or
        working through a more complex cable.
      </p>
      <p>
        And when you are ready to design your own motif, or to adapt a chart you found to fit your
        size, you can start from a blank grid and build it yourself.{" "}
        <Link href="/blog/knitting-chart-maker-online">Creating a knitting chart online</Link> works
        on the same logic of rows, symbols, and repeats you just learned — only this time you are
        the one in control. Open the <Link href="/patterns">editor</Link> whenever you want to try
        it.
      </p>
    </>
  )
};
