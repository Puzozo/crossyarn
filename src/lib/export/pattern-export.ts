import { PatternDocument } from "@/lib/patterns/model";
import { Language, translate } from "@/lib/i18n/translations";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapLabel(text: string, maxWidth: number, charWidth = 6.2): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (current === "") {
      // A single word always starts (or fills) a line, even if it overflows.
      current = word;
    } else if ((current + " " + word).length * charWidth <= maxWidth) {
      current = current + " " + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function patternToSvg(
  pattern: PatternDocument,
  title: string,
  photo?: { dataUri: string; width: number; height: number },
  lang: Language = "uk"
) {
  const cellSize = 24;
  const rightGutter = 32;
  const bottomGutter = 32;
  const MIN_LEGEND_WIDTH = 520;
  const PHOTO_MAX_WIDTH = 360;
  const PHOTO_MAX_HEIGHT = 240;
  const PHOTO_TOP = 40;
  const PHOTO_GAP = 16;
  let photoMarkup = "";
  let topOffset = 0;
  if (photo && photo.width > 0 && photo.height > 0) {
    const scale = Math.min(PHOTO_MAX_WIDTH / photo.width, PHOTO_MAX_HEIGHT / photo.height, 1);
    const pw = Math.round(photo.width * scale);
    const ph = Math.round(photo.height * scale);
    photoMarkup = `<image href="${escapeXml(photo.dataUri)}" x="0" y="${PHOTO_TOP}" width="${pw}" height="${ph}" preserveAspectRatio="xMidYMid meet" />`;
    topOffset = PHOTO_TOP + ph + PHOTO_GAP;
  }

  // When skipPurlRows is on, only odd-numbered rows are rendered (row number = height - rowIndex)
  const skipPurl = pattern.view.skipPurlRows ?? false;
  const visibleRowIndexes = Array.from({ length: pattern.height }, (_, i) => i)
    .filter((i) => !skipPurl || (pattern.height - i) % 2 === 1);

  const rapportMarks = pattern.rapportMarks ?? [];
  const RAPPORT_COLOR = "#d9480f";
  function mapMarkToDisplayRows(mark: { row: number; height: number }): { rowStart: number; rowSpan: number } | null {
    const rows: number[] = [];
    for (let r = mark.row; r < mark.row + mark.height; r++) {
      const idx = visibleRowIndexes.indexOf(r);
      if (idx !== -1) rows.push(idx);
    }
    if (rows.length === 0) return null;
    const rowStart = Math.min(...rows);
    return { rowStart, rowSpan: Math.max(...rows) - rowStart + 1 };
  }

  const gridWidth = pattern.width * cellSize;
  const gridHeight = visibleRowIndexes.length * cellSize;
  const width = Math.max(gridWidth + rightGutter, MIN_LEGEND_WIDTH);
  const gridBottom = topOffset + gridHeight;

  // Collect unique used symbols for legend (skip occupied cells and the background "empty")
  const usedIds = new Set<string>();
  for (const row of pattern.cells) {
    for (const cell of row) {
      if (cell.occupiedByAnchor) continue;
      usedIds.add(cell.symbolId);
    }
  }
  usedIds.delete("empty");
  const usedSymbols = pattern.symbols.filter((s) => usedIds.has(s.id));

  // One <symbol> def per image symbol (rendered once in <defs>, referenced via <use>)
  const symbolDefIds = new Map<string, string>();
  pattern.symbols
    .filter((s) => s.imageData)
    .forEach((s, index) => symbolDefIds.set(s.id, `sym-${index}`));

  const imageDefs = pattern.symbols
    .filter((s) => s.imageData)
    .map((s, index) => {
      const w = s.width ?? 1;
      return `<symbol id="sym-${index}" viewBox="0 0 ${w} 1" preserveAspectRatio="xMidYMid meet"><image href="${escapeXml(s.imageData!)}" width="${w}" height="1" preserveAspectRatio="xMidYMid meet" /></symbol>`;
    })
    .join("");
  const defsMarkup = imageDefs ? `<defs>${imageDefs}</defs>` : "";

  // Legend layout
  const legendTop = gridBottom + bottomGutter + 24;
  const symbolLabels = usedSymbols.map((symbol) => {
    const label = symbol.description && symbol.description !== symbol.label
      ? symbol.label + " — " + symbol.description
      : symbol.label;
    const widthLabel = (symbol.width ?? 1) > 1 ? ` (×${symbol.width})` : "";
    return label + widthLabel;
  });
  const maxLabelWidthPx = symbolLabels.reduce(
    (max, label) => Math.max(max, label.length * 6.2),
    0
  );
  const legendColumns = maxLabelWidthPx > width / 2 - 28 ? 1 : 2;
  const legendColWidth = Math.floor(width / legendColumns);

  const columnY: number[] = Array.from({ length: legendColumns }, () => legendTop + 24);
  const legendEntries = usedSymbols.map((symbol, index) => {
    const col = index % legendColumns;
    const label = symbolLabels[index];
    const lines = wrapLabel(label, legendColWidth - 28);
    const rowHeight = Math.max(28, lines.length * 14 + 8);
    const y = columnY[col];
    columnY[col] += rowHeight;
    return { symbol, col, y, lines };
  });
  const hasRapportMarks = rapportMarks.length > 0;
  let rapportLegendEntry: { col: number; y: number } | null = null;
  if (hasRapportMarks) {
    const col = usedSymbols.length % legendColumns;
    rapportLegendEntry = { col, y: columnY[col] };
    columnY[col] += 28;
  }
  const legendHeight = (usedSymbols.length > 0 || hasRapportMarks) ? Math.max(...columnY) - legendTop - 24 + 16 : 0;

  const totalHeight = legendTop + legendHeight;

  // Column numbers below the grid, counting right-to-left (column 0 shows N, column N-1 shows 1)
  const columnNumbers = Array.from({ length: pattern.width }, (_, columnIndex) => {
    const x = columnIndex * cellSize + cellSize / 2;
    const y = gridBottom + 20;
    return `<text x="${x}" y="${y}" text-anchor="middle" font-size="11" fill="#475569">${pattern.width - columnIndex}</text>`;
  }).join("");

  // Row numbers on the right side, counting bottom-to-top (row 0 shows N, row N-1 shows 1)
  const rowNumbers = visibleRowIndexes.map((rowIndex, displayIdx) => {
    const y = topOffset + displayIdx * cellSize + 16;
    const x = gridWidth + 16;
    return `<text x="${x}" y="${y}" text-anchor="middle" font-size="11" fill="#475569">${pattern.height - rowIndex}</text>`;
  }).join("");

  const rapportFrames = rapportMarks.map((mark) => {
    const mapped = mapMarkToDisplayRows(mark);
    if (!mapped) return "";
    const x = mark.col * cellSize;
    const y = topOffset + mapped.rowStart * cellSize;
    const w = mark.width * cellSize;
    const h = mapped.rowSpan * cellSize;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${RAPPORT_COLOR}" stroke-width="2" />`;
  }).join("");
  const rapportRowBrackets = rapportMarks.map((mark) => {
    const mapped = mapMarkToDisplayRows(mark);
    if (!mapped) return "";
    const x = gridWidth + 4;
    const y1 = topOffset + mapped.rowStart * cellSize;
    const y2 = y1 + mapped.rowSpan * cellSize;
    return `<path d="M ${x} ${y1} h6 M ${x} ${y1} V ${y2} M ${x} ${y2} h6" stroke="${RAPPORT_COLOR}" stroke-width="2" fill="none" />`;
  }).join("");
  const rapportColBrackets = rapportMarks.map((mark) => {
    const x1 = mark.col * cellSize;
    const x2 = x1 + mark.width * cellSize;
    const y = gridBottom + 2;
    return `<path d="M ${x1} ${y} v6 M ${x1} ${y} H ${x2} M ${x2} ${y} v6" stroke="${RAPPORT_COLOR}" stroke-width="2" fill="none" />`;
  }).join("");

  const cells = visibleRowIndexes
    .flatMap((rowIndex, displayIdx) =>
      pattern.cells[rowIndex].map((cell, columnIndex) => {
        // Skip cells occupied by a multi-cell symbol. In skip mode vertical spans
        // collapse; a symbol anchored in a hidden row is projected onto its first
        // visible row so it doesn't vanish from the chart.
        let displaySymbolId = cell.symbolId;
        if (cell.occupiedByAnchor) {
          if (!skipPurl || cell.occupiedByAnchor[0] === rowIndex) return "";
          const [ar, ac] = cell.occupiedByAnchor;
          const anchorHidden = (pattern.height - ar) % 2 === 0;
          if (anchorHidden && rowIndex === ar + 1) {
            const anchorCell = pattern.cells[ar]?.[ac];
            const anchorWidth = anchorCell
              ? pattern.symbols.find((s) => s.id === anchorCell.symbolId)?.width ?? 1
              : 1;
            if (columnIndex === ac && anchorCell) {
              displaySymbolId = anchorCell.symbolId;
            } else if (columnIndex < ac + anchorWidth) {
              return ""; // covered by the projected anchor's span
            }
          }
        }
        const symbol = pattern.symbols.find((item) => item.id === displaySymbolId);
        const symbolWidth = symbol?.width ?? 1;
        const glyph = symbol?.glyph ?? "\u00B7";
        const x = columnIndex * cellSize;
        const y = topOffset + displayIdx * cellSize;
        const spanWidth = cellSize * symbolWidth;
        const symbolMarkup = symbol?.imageData
          ? `<use href="#${symbolDefIds.get(symbol.id)}" x="${x + 4}" y="${y + 4}" width="${spanWidth - 8}" height="${cellSize - 8}" />`
          : `<text x="${x + spanWidth / 2}" y="${y + 16}" text-anchor="middle" font-size="12" fill="#111827">${escapeXml(glyph)}</text>`;
        return `
          <g>
            <rect x="${x}" y="${y}" width="${spanWidth}" height="${cellSize}" fill="${escapeXml(cell.color)}" stroke="#cbd5e1" />
            ${symbolMarkup}
          </g>
        `;
      })
    )
    .join("");

  // Legend markup
  let legendMarkup = "";
  if (usedSymbols.length > 0 || hasRapportMarks) {
    const legendTitleY = legendTop + 14;
    legendMarkup += `<text x="0" y="${legendTitleY}" font-size="14" font-family="Arial" font-weight="bold" fill="#1e293b">${escapeXml(translate(lang, "print.legend"))}</text>`;

    legendEntries.forEach(({ symbol, col, y, lines }) => {
      const x = col * legendColWidth;

      const iconMarkup = symbol.imageData
        ? `<use href="#${symbolDefIds.get(symbol.id)}" x="${x}" y="${y}" width="20" height="20" />`
        : `<text x="${x + 10}" y="${y + 15}" text-anchor="middle" font-size="14" fill="#1e293b">${escapeXml(symbol.glyph ?? "\u00B7")}</text>`;

      const tspans = lines
        .map((line, i) => `<tspan x="${x + 28}" dy="${i === 0 ? 0 : 14}">${escapeXml(line)}</tspan>`)
        .join("");
      legendMarkup += `
        ${iconMarkup}
        <text x="${x + 28}" y="${y + 15}" font-size="11" font-family="Arial" fill="#334155">${tspans}</text>
      `;
    });
    if (rapportLegendEntry) {
      const x = rapportLegendEntry.col * legendColWidth;
      const y = rapportLegendEntry.y;
      legendMarkup += `
        <rect x="${x + 2}" y="${y + 2}" width="16" height="16" fill="none" stroke="${RAPPORT_COLOR}" stroke-width="2" />
        <text x="${x + 28}" y="${y + 15}" font-size="11" font-family="Arial" fill="#334155">${escapeXml(translate(lang, "print.legendRapport"))}</text>
      `;
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}">
      ${defsMarkup}
      <rect width="100%" height="100%" fill="#ffffff" />
      <text x="0" y="24" font-size="20" font-family="Arial" fill="#111827">${escapeXml(title)}</text>
      ${photoMarkup}
      ${columnNumbers}
      ${rowNumbers}
      ${cells}
      ${rapportFrames}${rapportRowBrackets}${rapportColBrackets}
      ${legendMarkup}
    </svg>
  `.trim();
}
