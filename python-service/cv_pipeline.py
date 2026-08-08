"""
OpenCV grid detection + segmentation for knitting charts.

Turns a chart image into:
  - a W×H grid (cell boundaries),
  - one crop per cell,
  - distinct glyphs (perceptual-hash dedup) with optional CNN classification,
and assembles the `ImportResult` dict consumed by the Next.js preview.

Two-tier grid detection:
  1. Line-based: morphology isolates full-length grid lines; projection peaks give
     the boundary coordinates → exact rows/cols.
  2. Fallback: if line detection is implausible, partition the content bbox uniformly
     into width_hint × height_hint cells (the user's redetect W×H).

Works WITHOUT a trained model too: cells are split into empty (low ink) vs non-empty;
each distinct non-empty glyph becomes an "Unknown" crop. When the ONNX classifier is
present (classifier.is_available()), non-empty glyphs are mapped to our symbol ids.
"""
import base64
from typing import List, Optional, Tuple

import cv2
import numpy as np

import color as color_mod

CONFIDENCE_THRESHOLD = 0.7   # below this a mapped cell is FLAGGED for review in the UI
MAP_THRESHOLD = 0.45         # below this we don't trust the class at all → Unknown glyph
MAX_DIM = 200
EMPTY_INK_RATIO = 0.012      # below this fraction of dark pixels → empty cell
LINE_PEAK_FRAC = 0.35        # projection threshold for "this column/row is a grid line"
AHASH_HAMMING_TOL = 10       # max bit-difference to treat two Unknown glyphs as the same
BOUNDARY_INK_RATIO = 0.32    # heavy ink across a boundary → one symbol spans both cells.
                             # Conservative on purpose: single symbols with edge-reaching
                             # strokes (five-knit, wrap) must NOT merge. Thin-line cables
                             # need a dedicated wide classifier (see README).
BOUNDARY_STRIP_FRAC = 0.18   # width of the strip sampled at a boundary (fraction of cell)
DEFAULT_COLOR = "#f5ede1"
IMPORT_STAGES = ["uploaded", "preprocessed", "grid-detected", "segmented", "converted", "ready"]


# ── preprocess ─────────────────────────────────────────────────────────────────
def load(path: str) -> Tuple[np.ndarray, np.ndarray]:
    """Return (bgr, gray). Raises FileNotFoundError if unreadable."""
    bgr = cv2.imread(path, cv2.IMREAD_COLOR)
    if bgr is None:
        raise FileNotFoundError(path)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    return bgr, gray


def _binary_inv(gray: np.ndarray) -> np.ndarray:
    """Adaptive threshold so ink + grid lines become white (255) on black."""
    return cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY_INV, 25, 10
    )


# ── grid detection ──────────────────────────────────────────────────────────────
def _peaks(proj: np.ndarray, frac: float = LINE_PEAK_FRAC) -> List[float]:
    """Centers of contiguous high runs in a 1D projection → grid-line coordinates."""
    m = float(proj.max())
    if m <= 0:
        return []
    mask = (proj / m) > frac
    peaks: List[float] = []
    i, n = 0, len(mask)
    while i < n:
        if mask[i]:
            j = i
            while j < n and mask[j]:
                j += 1
            peaks.append((i + j - 1) / 2.0)
            i = j
        else:
            i += 1
    return peaks


def _regularize(peaks: List[float]) -> List[float]:
    """Snap detected line coords onto a uniform grid using their median spacing.

    Knitting charts are uniform grids, so this reconstructs lines that were faint or
    missing (e.g. a boundary between two same-coloured jacquard cells) and is robust to
    a few spurious peaks (median period)."""
    pts = sorted(peaks)
    if len(pts) < 3:
        return pts
    period = float(np.median(np.diff(pts)))
    if period <= 1:
        return pts
    n = int(round((pts[-1] - pts[0]) / period))
    if n < 1 or n > MAX_DIM:
        return pts
    return list(np.linspace(pts[0], pts[-1], n + 1))


def _content_bbox(bw: np.ndarray) -> Tuple[int, int, int, int]:
    """Tight bbox of all ink in the inverted-binary image: (x0, y0, x1, y1)."""
    cols = np.where(bw.sum(axis=0) > 0)[0]
    rows = np.where(bw.sum(axis=1) > 0)[0]
    if len(cols) == 0 or len(rows) == 0:
        h, w = bw.shape
        return 0, 0, w, h
    return int(cols[0]), int(rows[0]), int(cols[-1]) + 1, int(rows[-1]) + 1


def _lines_symbolic(gray: np.ndarray) -> Tuple[List[float], List[float]]:
    """Symbolic charts: keep only full-length dark lines (grid) via morphology, drop
    short symbol strokes. Proven on the synthetic symbolic charts."""
    bw = _binary_inv(gray)
    h, w = bw.shape
    v_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, max(8, h // 6)))
    h_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (max(8, w // 6), 1))
    vlines = cv2.morphologyEx(bw, cv2.MORPH_OPEN, v_kernel)
    hlines = cv2.morphologyEx(bw, cv2.MORPH_OPEN, h_kernel)
    # Regularize: reconstruct faint/missing lines (e.g. after a perspective warp blurs
    # them) from the median spacing. Identity on crisp, already-regular charts.
    return _regularize(_peaks(vlines.sum(axis=0))), _regularize(_peaks(hlines.sum(axis=1)))


def is_color_chart(bgr: np.ndarray) -> bool:
    """Grid-free heuristic: colour (jacquard) charts are mostly saturated fill (~0.8+),
    while symbolic charts are mostly white paper with thin (sometimes bluish) strokes
    (~0.1). 0.4 cleanly separates them and avoids misrouting symbol-heavy charts."""
    s = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)[:, :, 1]
    return float((s > 60).mean()) > 0.4


def _color_bbox(bgr: np.ndarray) -> Tuple[int, int, int, int]:
    """Bbox of the saturated (coloured) region = the jacquard grid extent."""
    s = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)[:, :, 1] > 50
    xs = np.where(s.any(axis=0))[0]
    ys = np.where(s.any(axis=1))[0]
    if len(xs) == 0 or len(ys) == 0:
        h, w = s.shape
        return 0, 0, w, h
    return int(xs[0]), int(ys[0]), int(xs[-1]) + 1, int(ys[-1]) + 1


def _autocorr_period(energy: np.ndarray) -> Optional[float]:
    """Dominant period of a 1-D projection via autocorrelation (robust to missing lines)."""
    n = len(energy)
    e = energy.astype(float) - float(energy.mean())
    ac = np.correlate(e, e, mode="full")[n - 1:]
    lo = max(6, n // 80)
    hi = n // 2
    if hi <= lo:
        return None
    period = lo + int(np.argmax(ac[lo:hi]))
    return float(period) if period >= 4 else None


def _lines_color(gray: np.ndarray, bbox: Tuple[int, int, int, int]) -> Tuple[List[float], List[float]]:
    """Colour charts: cell size from the gradient projection's period; boundaries are a
    uniform grid spanning the coloured bbox (no symbols to confuse the projection)."""
    gx = np.abs(cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3))
    gy = np.abs(cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3))
    x0, y0, x1, y1 = bbox
    px = _autocorr_period(gx.sum(axis=0)[x0:x1] if x1 > x0 else gx.sum(axis=0))
    py = _autocorr_period(gy.sum(axis=1)[y0:y1] if y1 > y0 else gy.sum(axis=1))
    if not px or not py:
        return [], []
    cols = max(1, round((x1 - x0) / px))
    rows = max(1, round((y1 - y0) / py))
    xs = list(np.linspace(x0, x1, cols + 1))
    ys = list(np.linspace(y0, y1, rows + 1))
    return xs, ys


def _uniform(bbox: Tuple[int, int, int, int], cols: int, rows: int) -> Tuple[List[float], List[float]]:
    x0, y0, x1, y1 = bbox
    xs = list(np.linspace(x0, x1, cols + 1))
    ys = list(np.linspace(y0, y1, rows + 1))
    return xs, ys


def detect_grid(
    gray: np.ndarray,
    bgr: Optional[np.ndarray] = None,
    width_hint: Optional[int] = None,
    height_hint: Optional[int] = None,
) -> Optional[Tuple[List[float], List[float]]]:
    """Return (xs, ys) boundary coordinates, or None if a grid can't be found.

    Dispatch: an explicit W×H hint → uniform partition; a colour chart → gradient/period
    detector over the coloured bbox; otherwise the symbolic line detector."""
    colour = bgr is not None and is_color_chart(bgr)
    bbox = _color_bbox(bgr) if colour else _content_bbox(_binary_inv(gray))

    if width_hint and height_hint and 1 <= width_hint <= MAX_DIM and 1 <= height_hint <= MAX_DIM:
        return _uniform(bbox, width_hint, height_hint)

    xs, ys = _lines_color(gray, bbox) if colour else _lines_symbolic(gray)
    cols, rows = len(xs) - 1, len(ys) - 1
    if 1 <= cols <= MAX_DIM and 1 <= rows <= MAX_DIM:
        return sorted(xs), sorted(ys)
    return None


# ── segmentation + features ──────────────────────────────────────────────────────
def crop_cell(img: np.ndarray, xs: List[float], ys: List[float], r: int, c: int, inset: float = 0.14) -> np.ndarray:
    """Crop the interior of cell (r, c), trimming `inset` of the cell to drop grid lines."""
    x0, x1 = xs[c], xs[c + 1]
    y0, y1 = ys[r], ys[r + 1]
    dx, dy = (x1 - x0) * inset, (y1 - y0) * inset
    a, b = int(round(x0 + dx)), int(round(x1 - dx))
    cc, dd = int(round(y0 + dy)), int(round(y1 - dy))
    if b <= a:
        b = a + 1
    if dd <= cc:
        dd = cc + 1
    return img[cc:dd, a:b]


def ink_ratio(gray_cell: np.ndarray) -> float:
    if gray_cell.size == 0:
        return 0.0
    dark = (gray_cell < 128).sum()
    return float(dark) / float(gray_cell.size)


def ahash(gray_cell: np.ndarray) -> str:
    """Average-hash → 16-hex-char string for cheap dedup of identical glyphs."""
    small = cv2.resize(gray_cell, (8, 8), interpolation=cv2.INTER_AREA)
    bits = (small < small.mean()).flatten()
    val = 0
    for b in bits:
        val = (val << 1) | int(b)
    return f"{val:016x}"


def _png_data_uri(bgr_cell: np.ndarray) -> str:
    ok, buf = cv2.imencode(".png", bgr_cell)
    if not ok:
        return ""
    return "data:image/png;base64," + base64.b64encode(buf.tobytes()).decode("ascii")


def _boundary_ink(gray: np.ndarray, xs: List[float], ys: List[float], r: int, c: int) -> float:
    """Ink fraction in a thin vertical strip straddling the boundary between cells
    (r, c) and (r, c+1). High when one symbol's strokes cross the grid line (a cable)."""
    bx = xs[c + 1]
    cw = xs[c + 1] - xs[c]
    half = max(1.0, cw * BOUNDARY_STRIP_FRAC / 2)
    y0, y1 = ys[r], ys[r + 1]
    dy = (y1 - y0) * 0.14
    a, b = int(round(bx - half)), int(round(bx + half))
    cc, dd = int(round(y0 + dy)), int(round(y1 - dy))
    strip = gray[max(0, cc):dd, max(0, a):b]
    return ink_ratio(strip)


def _span_crop(bgr: np.ndarray, xs: List[float], ys: List[float], r: int, c0: int, c1: int) -> np.ndarray:
    x0, x1 = xs[c0], xs[c1 + 1]
    y0, y1 = ys[r], ys[r + 1]
    dx, dy = (x1 - x0) * 0.04, (y1 - y0) * 0.1
    a, b = int(round(x0 + dx)), int(round(x1 - dx))
    cc, dd = int(round(y0 + dy)), int(round(y1 - dy))
    return bgr[max(0, cc):dd, max(0, a):b]


WIDE_WIDTHS = {"cable-4": 4, "cable-6": 6, "k3tog-wide": 3, "p3tog-wide": 3}


def _merge_multicell(cells: List[List[dict]], glyphs: dict, gray, bgr, xs, ys, wide_classify=None) -> None:
    """Post-pass: merge horizontally-adjacent non-empty cells whose glyph ink crosses the
    boundary (cables / wide motifs) into one wide symbol. Rewrites `cells`/`glyphs` in place.

    With a wide classifier present we use a LOW ink threshold to catch candidates (incl.
    thin-line cables) and let the classifier CONFIRM + NAME them (rejecting non-cables as
    "other", so neighbouring single symbols never falsely merge). Without it, we fall back
    to a conservative high threshold and emit wide Unknowns."""
    rows = len(cells)
    cols = len(cells[0]) if rows else 0

    def occupied(cell: dict) -> bool:
        return cell["hash"] == "empty" or "occupiedByAnchor" in cell

    def commit(r: int, c0: int, w: int, key: str) -> None:
        color = cells[r][c0]["color"]
        cells[r][c0] = {"hash": key, "color": color, "confidence": 0.95}
        glyphs[key]["occurrences"] += 1
        for cc in range(c0 + 1, c0 + w):
            cells[r][cc] = {"hash": "empty", "color": color, "confidence": 1.0, "occupiedByAnchor": [r, c0]}

    if wide_classify is not None:
        # Classifier-driven: extend a candidate across non-empty neighbours where ink
        # crosses the boundary (low threshold for recall), then let the CNN confirm + name
        # it (the "other" class rejects neighbouring single symbols → no false merges).
        from PIL import Image

        for r in range(rows):
            c = 0
            while c < cols:
                if occupied(cells[r][c]):
                    c += 1
                    continue
                end = c
                while (
                    end + 1 < cols
                    and not occupied(cells[r][end + 1])
                    and _boundary_ink(gray, xs, ys, r, end) > 0.04
                ):
                    end += 1
                w = end - c + 1
                named = None
                if w >= 2:
                    crop = _span_crop(bgr, xs, ys, r, c, end)
                    if crop.size:
                        try:
                            sym, p = wide_classify(Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)))
                            if p >= CONFIDENCE_THRESHOLD and WIDE_WIDTHS.get(sym) == w:
                                named = sym
                        except Exception:  # noqa: BLE001
                            named = None
                if named:
                    key = f"sym:{named}"
                    if key not in glyphs:
                        glyphs[key] = {
                            "hash": key, "image": _png_data_uri(_span_crop(bgr, xs, ys, r, c, end)),
                            "mappedSymbolId": named, "suggestedName": named, "width": w, "height": 1, "occurrences": 0,
                        }
                    commit(r, c, w, key)
                    c = end + 1
                else:
                    c += 1  # not a confirmed cable → leave as single cell(s)
        return

    # No classifier: conservative ink-merge → wide Unknown (heavy continuous spans only).
    wide_index: List[Tuple[int, int, str]] = []
    counter = 0
    for r in range(rows):
        c = 0
        while c < cols:
            if occupied(cells[r][c]):
                c += 1
                continue
            end = c
            while (
                end + 1 < cols
                and not occupied(cells[r][end + 1])
                and _boundary_ink(gray, xs, ys, r, end) > BOUNDARY_INK_RATIO
            ):
                end += 1
            w = end - c + 1
            if w >= 2:
                crop = _span_crop(bgr, xs, ys, r, c, end)
                h_int = int(ahash(cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)), 16) if crop.size else 0
                key = None
                for (ww, hi, k) in wide_index:
                    if ww == w and bin(hi ^ h_int).count("1") <= AHASH_HAMMING_TOL:
                        key = k
                        break
                if key is None:
                    counter += 1
                    key = f"w{counter}"
                    glyphs[key] = {
                        "hash": key, "image": _png_data_uri(crop), "mappedSymbolId": None,
                        "suggestedName": f"Unknown{counter}", "width": w, "height": 1, "occurrences": 0,
                    }
                    wide_index.append((w, h_int, key))
                commit(r, c, w, key)
            c = end + 1


# ── assemble ImportResult ──────────────────────────────────────────────────────
def run(path: str, width: Optional[int] = None, height: Optional[int] = None) -> dict:
    bgr, gray = load(path)

    # Perspective correction for photos (no-op for flat scans). Always run — including on
    # a manual W×H re-detect — so the uniform partition is applied to the rectified chart.
    import deskew

    corr = deskew.correct_perspective(bgr)
    if corr["applied"]:
        bgr = corr["image"]
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    deskew_failed = corr["needed"] and not corr["applied"]

    grid = detect_grid(gray, bgr, width, height)
    if grid is None:
        raise GridDetectionError("grid-detection-failed")
    xs, ys = grid
    cols, rows = len(xs) - 1, len(ys) - 1

    # Colour (jacquard) analysis — only for actual colour charts, so a dark filled
    # symbol (bobble, slip-back) on a symbolic chart is never mistaken for a colour cell.
    if is_color_chart(bgr):
        colour = color_mod.analyze(bgr, xs, ys)
        colour_grid, palette = colour["grid"], colour["palette"]
    else:
        colour_grid, palette = [[None] * cols for _ in range(rows)], []

    # Optional legend OCR (requires tesseract). Builds a visual map: legend glyph
    # perceptual-hash -> our symbol id, used as a prior when the CNN is unsure.
    legend_map: List[Tuple[int, str, str]] = []  # (hash_int, symbol_id, description)
    if not is_color_chart(bgr):
        try:
            import legend as legend_mod

            if legend_mod.available():
                region = legend_mod.detect_legend_region(
                    gray, (int(xs[0]), int(ys[0]), int(xs[-1]), int(ys[-1]))
                )
                if region:
                    for e in legend_mod.read_legend(bgr, region):
                        gx0, gy0, gx1, gy1 = e["glyphBox"]
                        gcrop = gray[gy0:gy1, gx0:gx1]
                        if e["symbolId"] and gcrop.size:
                            legend_map.append((int(ahash(gcrop), 16), e["symbolId"], e["text"]))
        except Exception:  # noqa: BLE001
            legend_map = []
    legend_detected = len(legend_map) > 0

    # Optional CNN classifiers (present only after train.py has run).
    classify = None
    wide_classify = None
    try:
        import classifier

        if classifier.is_available():
            classify = classifier.classify
        if classifier.wide_available():
            wide_classify = classifier.classify_wide
    except Exception:  # noqa: BLE001
        classify = None

    from PIL import Image  # local import; PIL is a service dep

    glyphs: dict = {
        "empty": {
            "hash": "empty",
            "image": "",
            "mappedSymbolId": "empty",
            "suggestedName": "Empty",
            "width": 1,
            "height": 1,
            "occurrences": 0,
        }
    }
    # Unknown glyphs are clustered by perceptual hash with a Hamming tolerance so that
    # the same hand-drawn mark in different cells maps to ONE Unknown (not dozens).
    unknown_index: List[Tuple[int, str]] = []  # (hash_int, glyph_key)
    unknown_counter = 0
    cells: List[List[dict]] = []
    low_conf = 0

    def match_unknown(h_int: int) -> Optional[str]:
        for hi, key in unknown_index:
            if bin(hi ^ h_int).count("1") <= AHASH_HAMMING_TOL:
                return key
        return None

    for r in range(rows):
        row: List[dict] = []
        for c in range(cols):
            # Colour cell (jacquard): carry the palette colour, no symbol. (v1 ignores
            # a glyph drawn on top of a colour — rare; handled by manual edit.)
            chex = colour_grid[r][c]
            if chex is not None:
                glyphs["empty"]["occurrences"] += 1
                row.append({"hash": "empty", "color": chex, "confidence": 1.0})
                continue

            gcell = crop_cell(gray, xs, ys, r, c)
            if ink_ratio(gcell) < EMPTY_INK_RATIO:
                glyphs["empty"]["occurrences"] += 1
                row.append({"hash": "empty", "color": DEFAULT_COLOR, "confidence": 1.0})
                continue

            h_int = int(ahash(gcell), 16)
            key: Optional[str] = None
            conf = 0.5

            # 1. When the model is present, group by the classified symbol id: every
            #    cell that reads as "knit" shares one glyph entry mapped to knit.
            if classify is not None:
                bgr_cell = crop_cell(bgr, xs, ys, r, c)
                sym, p = classify(Image.fromarray(cv2.cvtColor(bgr_cell, cv2.COLOR_BGR2RGB)))
                if p >= MAP_THRESHOLD and sym != "empty":
                    # Trust the class; keep the model's probability as the cell confidence
                    # so the UI still flags 0.45–0.7 cells for review (CONFIDENCE_THRESHOLD).
                    key = f"sym:{sym}"
                    conf = p
                    if key not in glyphs:
                        glyphs[key] = {
                            "hash": key, "image": _png_data_uri(bgr_cell), "mappedSymbolId": sym,
                            "suggestedName": sym, "width": 1, "height": 1, "occurrences": 0,
                        }

            # 2. Legend prior: if a read legend has a glyph matching this cell, trust it.
            if key is None and legend_map:
                for lh, lsid, ltext in legend_map:
                    if bin(lh ^ h_int).count("1") <= AHASH_HAMMING_TOL:
                        key = f"sym:{lsid}"
                        conf = max(conf, 0.85)
                        if key not in glyphs:
                            bgr_cell = crop_cell(bgr, xs, ys, r, c)
                            glyphs[key] = {
                                "hash": key, "image": _png_data_uri(bgr_cell), "mappedSymbolId": lsid,
                                "suggestedName": lsid, "description": ltext,
                                "width": 1, "height": 1, "occurrences": 0,
                            }
                        break

            # 3. Otherwise it's Unknown — cluster by Hamming-tolerant perceptual hash.
            if key is None:
                key = match_unknown(h_int)
                if key is None:
                    unknown_counter += 1
                    key = f"u{unknown_counter}"
                    bgr_cell = crop_cell(bgr, xs, ys, r, c)
                    glyphs[key] = {
                        "hash": key, "image": _png_data_uri(bgr_cell), "mappedSymbolId": None,
                        "suggestedName": f"Unknown{unknown_counter}", "width": 1, "height": 1, "occurrences": 0,
                    }
                    unknown_index.append((h_int, key))

            g = glyphs[key]
            g["occurrences"] += 1
            cell_conf = conf if g["mappedSymbolId"] else 0.5
            if cell_conf < CONFIDENCE_THRESHOLD:
                low_conf += 1
            row.append({"hash": key, "color": DEFAULT_COLOR, "confidence": round(float(cell_conf), 2)})
        cells.append(row)

    # Merge multi-cell symbols (cables) into wide glyphs. Not for colour charts.
    if not is_color_chart(bgr):
        _merge_multicell(cells, glyphs, gray, bgr, xs, ys, wide_classify)

    return {
        "stages": IMPORT_STAGES,
        "suggestedTitle": "Імпортована схема",
        "grid": {"width": cols, "height": rows},
        "cells": cells,
        "glyphs": glyphs,
        "palette": palette,
        "legendDetected": legend_detected,
        "deskewFailed": deskew_failed,
        "lowConfidenceCount": low_conf,
        "confidenceThreshold": CONFIDENCE_THRESHOLD,
    }


class GridDetectionError(Exception):
    pass
