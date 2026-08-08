"""
Legend reading: OCR a chart's legend (glyph ↔ description) and match each description
to one of our standard symbols, so grid glyphs can be auto-mapped from the legend.

OCR (pytesseract) needs the `tesseract` binary on the host. When it's missing this
module degrades gracefully: `available()` is False, `read_legend()` returns [], and the
pipeline simply proceeds without legend mapping. The text→symbol matcher (`match_symbol`)
is pure Python and always works (and is unit-tested in validate_legend.py).
"""
import difflib
import re
from typing import List, Optional, Tuple

# Canonical Ukrainian labels for our single-cell symbols.
# Keep in sync with DEFAULT_SYMBOLS in src/lib/patterns/model.ts.
SYMBOL_LABELS = {
    "knit": "лицьова петля",
    "purl": "виворітна петля",
    "yarn-over": "накид",
    "purl-in-yarn-over": "накид провязати виворітною",
    "cross-purl": "виворітна схрещена",
    "cross-knit": "лицьова схрещена",
    "k2tog-left": "2 разом лицьовою з нахилом вліво",
    "k2tog-right": "2 разом лицьовою з нахилом вправо",
    "p2tog-left": "2 разом виворітною з нахилом вліво",
    "p2tog-right": "2 разом виворітною з нахилом вправо",
    "k3tog": "3 разом лицьовою",
    "p3tog": "3 разом виворітною",
    "slip-back": "знята петля нитка за роботою",
    "slip-front": "знята петля нитка перед роботою",
    "two-from-one": "2 петлі з однієї",
    "three-from-one": "3 петлі з однієї",
    "four-from-one": "4 петлі з однієї",
    "four-together": "4 петлі разом",
    "five-from-one": "5 петель з однієї",
    "five-together": "5 петель разом",
    "five-knit": "5 лицьових",
    "wrap": "платочна вязка",
    "bobble": "шишка",
    "empty": "порожня клітинка",
}

MATCH_THRESHOLD = 0.45


def _norm(s: str) -> str:
    s = s.lower().replace("'", "").replace("’", "")
    s = re.sub(r"[^\w\s]", " ", s, flags=re.UNICODE)
    return re.sub(r"\s+", " ", s).strip()


def _score(a: str, b: str) -> float:
    """Blend sequence ratio with token-overlap (Jaccard) for short knitting phrases."""
    ratio = difflib.SequenceMatcher(None, a, b).ratio()
    ta, tb = set(a.split()), set(b.split())
    jacc = len(ta & tb) / len(ta | tb) if (ta and tb) else 0.0
    return 0.5 * ratio + 0.5 * jacc


def match_symbol(text: str) -> Tuple[Optional[str], float]:
    """Map an OCR'd legend description to a symbol id (or None below threshold)."""
    q = _norm(text)
    if not q:
        return None, 0.0
    best_id, best = None, 0.0
    for sid, label in SYMBOL_LABELS.items():
        sc = _score(q, _norm(label))
        if sc > best:
            best_id, best = sid, sc
    return (best_id, best) if best >= MATCH_THRESHOLD else (None, best)


def available() -> bool:
    """True only if pytesseract is importable AND the tesseract binary is on the host."""
    try:
        import pytesseract

        pytesseract.get_tesseract_version()
        return True
    except Exception:  # noqa: BLE001
        return False


def detect_legend_region(gray, grid_bbox) -> Optional[Tuple[int, int, int, int]]:
    """Find legend content outside the grid bbox (to the right, else below)."""
    import numpy as np

    h, w = gray.shape
    gx0, gy0, gx1, gy1 = grid_bbox
    ink = (gray < 160)
    # Region to the right of the grid?
    if w - gx1 > 40:
        right = ink[:, gx1 + 5:]
        if right.sum() > 50:
            xs = np.where(right.any(axis=0))[0]
            ys = np.where(right.any(axis=1))[0]
            return (gx1 + 5 + int(xs[0]), int(ys[0]), gx1 + 5 + int(xs[-1]) + 1, int(ys[-1]) + 1)
    # Region below the grid?
    if h - gy1 > 40:
        below = ink[gy1 + 5:, :]
        if below.sum() > 50:
            xs = np.where(below.any(axis=0))[0]
            ys = np.where(below.any(axis=1))[0]
            return (int(xs[0]), gy1 + 5 + int(ys[0]), int(xs[-1]) + 1, gy1 + 5 + int(ys[-1]) + 1)
    return None


def read_legend(bgr, region: Tuple[int, int, int, int]) -> List[dict]:
    """OCR the legend region into [{text, symbolId, score, glyphBox}]. [] if no tesseract.

    Groups OCR words into lines by their y-position; the glyph for a line is assumed to
    sit to the left of its text (a crop returned as glyphBox in full-image coords)."""
    if not available():
        return []
    import pytesseract
    from collections import defaultdict

    x0, y0, x1, y1 = region
    crop = bgr[y0:y1, x0:x1]
    data = pytesseract.image_to_data(crop, lang="ukr+eng", output_type=pytesseract.Output.DICT)

    lines = defaultdict(list)
    for i, word in enumerate(data["text"]):
        if word.strip():
            key = (data["block_num"][i], data["line_num"][i])
            lines[key].append((data["left"][i], data["top"][i], data["width"][i], data["height"][i], word))

    entries: List[dict] = []
    for _, words in lines.items():
        words.sort(key=lambda t: t[0])
        text = " ".join(w[4] for w in words)
        sid, score = match_symbol(text)
        left = min(w[0] for w in words)
        top = min(w[1] for w in words)
        bottom = max(w[1] + w[3] for w in words)
        glyph_box = (x0, y0 + top, x0 + left, y0 + bottom)  # area left of the text
        entries.append({"text": text, "symbolId": sid, "score": round(score, 3), "glyphBox": glyph_box})
    return entries


if __name__ == "__main__":
    # Quick manual check of the matcher.
    for t in ["Лицьова петля", "накид", "2 разом лиц. вліво", "шишка", "qwerty zzz"]:
        print(f"{t!r:40} -> {match_symbol(t)}")
