"""
Perspective correction for photographed charts.

Finds the chart's outer quadrilateral and warps it to an axis-aligned rectangle (the
classic document-scanner transform), so the downstream grid detector sees a clean grid.

No-op for already-flat scans/screenshots: if the largest 4-corner contour fills the
frame (or none is found), the original image is returned unchanged. When a chart-sized
object is present but a clean quad can't be extracted, `needed=True, applied=False`
signals the UI to offer manual 4-corner adjustment.
"""
from typing import Optional

import cv2
import numpy as np


def _order(pts: np.ndarray) -> np.ndarray:
    """Order 4 points TL, TR, BR, BL."""
    pts = pts.astype("float32")
    s = pts.sum(axis=1)
    d = np.diff(pts, axis=1).ravel()
    return np.array(
        [pts[np.argmin(s)], pts[np.argmin(d)], pts[np.argmax(s)], pts[np.argmax(d)]],
        dtype="float32",
    )


def _near_full_frame(quad: np.ndarray, w: int, h: int, tol: float = 0.08) -> bool:
    """True if the quad's corners sit at the image corners (already-flat scan)."""
    t = tol * min(w, h)
    corners = np.array([[0, 0], [w, 0], [w, h], [0, h]], dtype="float32")
    return bool(np.all(np.linalg.norm(quad - corners, axis=1) < t))


def correct_perspective(bgr: np.ndarray) -> dict:
    h, w = bgr.shape[:2]
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    # Separate the bright chart (paper) from the darker surface (Otsu), then close it
    # into a solid blob so internal grid lines don't fragment the contour.
    _, th = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    th = cv2.morphologyEx(th, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (9, 9)))

    contours, _ = cv2.findContours(th, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return {"image": bgr, "applied": False, "needed": False, "quad": None}

    cnt = max(contours, key=cv2.contourArea)
    area_frac = cv2.contourArea(cnt) / float(w * h)
    # Fills the frame (clean scan / colour chart) or too small → not a tilted photo. No-op.
    if area_frac < 0.2 or area_frac > 0.9:
        return {"image": bgr, "applied": False, "needed": False, "quad": None}

    peri = cv2.arcLength(cnt, True)
    approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
    if len(approx) != 4:
        # Big inset object but no clean quad — don't risk a bad warp, don't false-flag.
        return {"image": bgr, "applied": False, "needed": False, "quad": None}

    quad = _order(approx.reshape(4, 2))
    if _near_full_frame(quad, w, h):
        return {"image": bgr, "applied": False, "needed": False, "quad": quad.tolist()}

    # Output size from the quad's edge lengths.
    (tl, tr, br, bl) = quad
    out_w = int(max(np.linalg.norm(br - bl), np.linalg.norm(tr - tl)))
    out_h = int(max(np.linalg.norm(tr - br), np.linalg.norm(tl - bl)))
    if out_w < 16 or out_h < 16:
        return {"image": bgr, "applied": False, "needed": True, "quad": quad.tolist()}

    dst = np.array([[0, 0], [out_w - 1, 0], [out_w - 1, out_h - 1], [0, out_h - 1]], dtype="float32")
    M = cv2.getPerspectiveTransform(quad, dst)
    warped = cv2.warpPerspective(bgr, M, (out_w, out_h))
    return {"image": warped, "applied": True, "needed": True, "quad": quad.tolist()}
