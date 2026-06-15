function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to render SVG"));
    img.src = src;
  });
}

/**
 * Exports the pattern as PDF by rasterizing the server-rendered SVG to a PNG and
 * placing that into the PDF. We deliberately avoid svg2pdf.js vector text here:
 * it renders SVG <text> with jsPDF's built-in Helvetica, which has no Cyrillic
 * glyphs, so the legend/title came out garbled. Rasterizing turns text into pixels,
 * so any language renders correctly without embedding a font. The chart is mostly
 * image-based symbols anyway, so the quality trade-off is negligible.
 */
export async function downloadPatternAsPdf(patternId: string, title: string) {
  const res = await fetch(`/api/exports/${patternId}`);
  if (!res.ok) throw new Error("Failed to fetch pattern SVG");
  const svgText = await res.text();

  const widthMatch = svgText.match(/\bwidth="(\d+(?:\.\d+)?)"/);
  const heightMatch = svgText.match(/\bheight="(\d+(?:\.\d+)?)"/);
  const svgW = widthMatch ? parseFloat(widthMatch[1]) : 600;
  const svgH = heightMatch ? parseFloat(heightMatch[1]) : 600;

  // Oversample for crisp output, but cap the canvas so huge charts don't blow up memory.
  const MAX_CANVAS_DIM = 4000;
  const scaleFactor = Math.min(3, MAX_CANVAS_DIM / Math.max(svgW, svgH));

  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(svgW * scaleFactor));
    canvas.height = Math.max(1, Math.round(svgH * scaleFactor));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const png = canvas.toDataURL("image/png");

    const { jsPDF } = await import("jspdf");
    const isLandscape = svgW > svgH;
    const doc = new jsPDF({
      orientation: isLandscape ? "landscape" : "portrait",
      unit: "pt",
      format: "a4"
    });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 30;
    const fit = Math.min((pageW - margin * 2) / svgW, (pageH - margin * 2) / svgH);
    const w = svgW * fit;
    const h = svgH * fit;

    doc.addImage(png, "PNG", (pageW - w) / 2, (pageH - h) / 2, w, h);
    doc.save(`${title}.pdf`);
  } finally {
    URL.revokeObjectURL(url);
  }
}
