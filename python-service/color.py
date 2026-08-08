"""
Colour (jacquard) detection for charts whose cells are solid colour blocks rather
than symbols. Each non-paper cell's dominant colour is quantized with k-means into a
small palette; the cell then carries that palette colour.

Symbolic (white/paper) charts produce no palette and fall through to the symbol path.
"""
from typing import List, Optional

import cv2
import numpy as np

MAX_PALETTE = 12


def _hex(bgr) -> str:
    b, g, r = (int(max(0, min(255, round(x)))) for x in bgr)
    return f"#{r:02x}{g:02x}{b:02x}"


def _is_paper(bgr_mean) -> bool:
    """Near-white / cream background → not a colour cell."""
    px = np.uint8([[list(bgr_mean)]])
    h, s, v = cv2.cvtColor(px, cv2.COLOR_BGR2HSV)[0][0]
    return v > 205 and s < 35


def _cell_color(bgr_cell: np.ndarray):
    """Per-channel median — robust to a stray glyph/grid pixel."""
    return [float(np.median(bgr_cell[:, :, i])) for i in range(3)]


def _estimate_k(colors: np.ndarray) -> int:
    q = (np.round(colors / 40.0) * 40).astype(int)
    uniq = np.unique(q, axis=0)
    return int(max(2, min(MAX_PALETTE, len(uniq))))


def analyze(bgr: np.ndarray, xs: List[float], ys: List[float], inset: float = 0.18) -> dict:
    rows, cols = len(ys) - 1, len(xs) - 1
    means: List[List[Optional[list]]] = []
    colored_samples: List[list] = []

    for r in range(rows):
        mrow: List[Optional[list]] = []
        for c in range(cols):
            x0, x1 = xs[c], xs[c + 1]
            y0, y1 = ys[r], ys[r + 1]
            dx, dy = (x1 - x0) * inset, (y1 - y0) * inset
            a, b = int(round(x0 + dx)), int(round(x1 - dx))
            cc, dd = int(round(y0 + dy)), int(round(y1 - dy))
            if b <= a:
                b = a + 1
            if dd <= cc:
                dd = cc + 1
            cell = bgr[cc:dd, a:b]
            m = _cell_color(cell) if cell.size else [255.0, 255.0, 255.0]
            if _is_paper(m):
                mrow.append(None)
            else:
                mrow.append(m)
                colored_samples.append(m)
        means.append(mrow)

    # Too few coloured cells → treat as a symbolic chart (no palette).
    if len(colored_samples) < max(4, (rows * cols) // 20):
        return {"isColored": False, "palette": [], "grid": [[None] * cols for _ in range(rows)]}

    samples = np.array(colored_samples, dtype=np.float32)
    k = _estimate_k(samples)
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 20, 1.0)
    _, _, centers = cv2.kmeans(samples, k, None, criteria, 4, cv2.KMEANS_PP_CENTERS)

    palette = [_hex(c) for c in centers]

    # Assign every coloured cell to its nearest palette centre.
    grid: List[List[Optional[str]]] = []
    for r in range(rows):
        grow: List[Optional[str]] = []
        for c in range(cols):
            m = means[r][c]
            if m is None:
                grow.append(None)
            else:
                d = np.linalg.norm(centers - np.array(m, dtype=np.float32), axis=1)
                grow.append(_hex(centers[int(d.argmin())]))
        grid.append(grow)

    return {"isColored": True, "palette": palette, "grid": grid}
