import { PatternDocument } from "@/lib/patterns/model";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function patternToSvg(pattern: PatternDocument, title: string) {
  const cellSize = 24;
  const rightGutter = 32;
  const bottomGutter = 32;
  const gridWidth = pattern.width * cellSize;
  const gridHeight = pattern.height * cellSize;
  const width = gridWidth + rightGutter;
  const gridBottom = gridHeight;

  // Collect unique used symbols for legend
  const usedIds = new Set<string>();
  for (const row of pattern.cells) {
    for (const cell of row) {
      usedIds.add(cell.symbolId);
    }
  }
  const usedSymbols = pattern.symbols.filter((s) => usedIds.has(s.id));

  // Legend layout
  const legendTop = gridBottom + bottomGutter + 24;
  const legendRowHeight = 28;
  const legendColumns = 2;
  const legendColWidth = Math.floor(width / legendColumns);
  const legendRows = Math.ceil(usedSymbols.length / legendColumns);
  const legendHeight = usedSymbols.length > 0 ? 24 + legendRows * legendRowHeight + 16 : 0;

  const totalHeight = legendTop + legendHeight;

  // Column numbers below the grid, counting right-to-left (column 0 shows N, column N-1 shows 1)
  const columnNumbers = Array.from({ length: pattern.width }, (_, columnIndex) => {
    const x = columnIndex * cellSize + cellSize / 2;
    const y = gridBottom + 20;
    return `<text x="${x}" y="${y}" text-anchor="middle" font-size="11" fill="#475569">${pattern.width - columnIndex}</text>`;
  }).join("");

  // Row numbers on the right side, counting bottom-to-top (row 0 shows N, row N-1 shows 1)
  const rowNumbers = Array.from({ length: pattern.height }, (_, rowIndex) => {
    const y = rowIndex * cellSize + 16;
    const x = gridWidth + 16;
    const rowNum = pattern.view.skipPurlRows
      ? (pattern.height - rowIndex) * 2 - 1
      : pattern.height - rowIndex;
    return `<text x="${x}" y="${y}" text-anchor="middle" font-size="11" fill="#475569">${rowNum}</text>`;
  }).join("");

  const cells = pattern.cells
    .flatMap((row, rowIndex) =>
      row.map((cell, columnIndex) => {
        // Skip cells occupied by a multi-cell symbol
        if (cell.occupiedByAnchor) {
          return "";
        }
        const symbol = pattern.symbols.find((item) => item.id === cell.symbolId);
        const symbolWidth = symbol?.width ?? 1;
        const glyph = symbol?.glyph ?? "\u00B7";
        const x = columnIndex * cellSize;
        const y = rowIndex * cellSize;
        const spanWidth = cellSize * symbolWidth;
        const symbolMarkup = symbol?.imageData
          ? `<image href="${escapeXml(symbol.imageData)}" x="${x + 4}" y="${y + 4}" width="${spanWidth - 8}" height="${cellSize - 8}" />`
          : `<text x="${x + spanWidth / 2}" y="${y + 16}" text-anchor="middle" font-size="12" fill="#111827">${escapeXml(glyph)}</text>`;
        return `
          <g>
            <rect x="${x}" y="${y}" width="${spanWidth}" height="${cellSize}" fill="${cell.color}" stroke="#cbd5e1" />
            ${symbolMarkup}
          </g>
        `;
      })
    )
    .join("");

  // Legend markup
  let legendMarkup = "";
  if (usedSymbols.length > 0) {
    const legendTitleY = legendTop + 14;
    legendMarkup += `<text x="0" y="${legendTitleY}" font-size="14" font-family="Arial" font-weight="bold" fill="#1e293b">Легенда</text>`;

    usedSymbols.forEach((symbol, index) => {
      const col = index % legendColumns;
      const row = Math.floor(index / legendColumns);
      const x = col * legendColWidth;
      const y = legendTop + 24 + row * legendRowHeight;

      const iconMarkup = symbol.imageData
        ? `<image href="${escapeXml(symbol.imageData)}" x="${x}" y="${y}" width="20" height="20" />`
        : `<text x="${x + 10}" y="${y + 15}" text-anchor="middle" font-size="14" fill="#1e293b">${escapeXml(symbol.glyph ?? "\u00B7")}</text>`;

      const label = symbol.description ?? symbol.label;
      const widthLabel = (symbol.width ?? 1) > 1 ? ` (×${symbol.width})` : "";
      legendMarkup += `
        ${iconMarkup}
        <text x="${x + 28}" y="${y + 15}" font-size="11" font-family="Arial" fill="#334155">${escapeXml(label + widthLabel)}</text>
      `;
    });
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${totalHeight}" viewBox="0 0 ${width} ${totalHeight}">
      <rect width="100%" height="100%" fill="#ffffff" />
      <text x="0" y="24" font-size="20" font-family="Arial" fill="#111827">${escapeXml(title)}</text>
      ${columnNumbers}
      ${rowNumbers}
      ${cells}
      ${legendMarkup}
    </svg>
  `.trim();
}
