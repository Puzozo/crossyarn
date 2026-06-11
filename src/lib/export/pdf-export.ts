export async function downloadPatternAsPdf(patternId: string, title: string) {
  const res = await fetch(`/api/exports/${patternId}`);
  if (!res.ok) throw new Error("Failed to fetch pattern SVG");
  const svgText = await res.text();

  // Mount SVG in DOM — svg2pdf.js requires a live document element
  const container = document.createElement("div");
  container.style.cssText = "position:absolute;left:-9999px;top:-9999px;visibility:hidden;width:0;height:0;overflow:hidden";
  container.innerHTML = svgText;
  document.body.appendChild(container);
  const svgEl = container.querySelector("svg") as SVGSVGElement;

  const svgW = parseFloat(svgEl.getAttribute("width") ?? "600");
  const svgH = parseFloat(svgEl.getAttribute("height") ?? "600");

  const { jsPDF } = await import("jspdf");
  const { svg2pdf } = await import("svg2pdf.js");

  const isLandscape = svgW > svgH;
  const doc = new jsPDF({
    orientation: isLandscape ? "landscape" : "portrait",
    unit: "pt",
    format: "a4"
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 30;
  const scale = Math.min((pageW - margin * 2) / svgW, (pageH - margin * 2) / svgH);
  const x = (pageW - svgW * scale) / 2;
  const y = (pageH - svgH * scale) / 2;

  try {
    await svg2pdf(svgEl, doc, { x, y, width: svgW * scale, height: svgH * scale });
    doc.save(`${title}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
