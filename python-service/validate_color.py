"""
Validate colour (jacquard) detection against synthetic colour charts' ground truth.

Run (after `npm run generate:dataset -- --color-charts N`):
  cd python-service && python validate_color.py
"""
import glob
import json
import os

import numpy as np

import cv_pipeline as cvp


def hex2bgr(h: str) -> np.ndarray:
    h = h.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return np.array([b, g, r], dtype=float)


charts = sorted(glob.glob(os.path.join("dataset", "charts-color", "*.png")))
if not charts:
    raise SystemExit("No colour charts. Run: npm run generate:dataset -- --color-charts 20")

dim_ok = 0
cell_total = cell_correct = 0
pal_exact = 0

for png in charts:
    name = os.path.basename(png)
    with open(png[:-4] + ".json", encoding="utf-8") as f:
        truth = json.load(f)

    try:
        res = cvp.run(png)
    except Exception as e:  # noqa: BLE001
        print(f"{name}: run failed ({e.__class__.__name__})")
        continue
    cols, rows = res["grid"]["width"], res["grid"]["height"]
    if cols != truth["width"] or rows != truth["height"]:
        print(f"{name}: DIM-MISMATCH truth {truth['width']}x{truth['height']} det {cols}x{rows}")
        continue
    dim_ok += 1

    tpal = [hex2bgr(x) for x in truth["palette"]]

    def nearest_truth_idx(bgr: np.ndarray) -> int:
        return int(np.argmin([np.linalg.norm(bgr - t) for t in tpal]))

    correct = total = 0
    for r in range(rows):
        for c in range(cols):
            det = hex2bgr(res["cells"][r][c]["color"])
            tru = hex2bgr(truth["cells"][r][c])
            if nearest_truth_idx(det) == nearest_truth_idx(tru):
                correct += 1
            total += 1
    cell_correct += correct
    cell_total += total

    det_pal = len(res.get("palette", []))
    if det_pal == len(truth["palette"]):
        pal_exact += 1
    print(
        f"{name}: {cols}x{rows} | palette truth/det {len(truth['palette'])}/{det_pal} "
        f"| colour-id accuracy {correct / max(1, total):.3f}"
    )

print(f"\nGrid dims correct: {dim_ok}/{len(charts)} | palette size exact: {pal_exact}/{len(charts)}")
if cell_total:
    print(f"Per-cell colour-identity accuracy: {cell_correct / cell_total:.3f}  (n={cell_total})")
