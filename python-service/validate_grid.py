"""
Validate OpenCV grid detection against the synthetic charts' ground truth.

Run (after `npm run generate:dataset`):
  cd python-service && python validate_grid.py
"""
import glob
import json
import os

import cv_pipeline as cvp

try:
    import classifier
    HAS_MODEL = classifier.is_available()
except Exception:  # noqa: BLE001
    HAS_MODEL = False

charts = sorted(glob.glob(os.path.join("dataset", "charts", "*.png")))
if not charts:
    raise SystemExit("No charts found. Run: npm run generate:dataset")

ok = 0
cell_total = cell_correct = cell_unknown = 0


def predicted_symbol(res: dict, cell: dict) -> str:
    if cell["hash"] == "empty":
        return "empty"
    g = res["glyphs"].get(cell["hash"], {})
    return g.get("mappedSymbolId") or "unknown"
for png in charts:
    name = os.path.basename(png)
    with open(png[:-4] + ".json", encoding="utf-8") as f:
        truth = json.load(f)

    _, gray = cvp.load(png)
    grid = cvp.detect_grid(gray)  # no hint → pure line detection
    if grid is None:
        print(f"{name}: detect_grid -> None  (truth {truth['width']}x{truth['height']})  FAIL")
        continue
    xs, ys = grid
    cols, rows = len(xs) - 1, len(ys) - 1

    res = cvp.run(png)
    truth_empty = sum(1 for row in truth["cells"] for s in row if s == "empty")
    det_empty = sum(1 for row in res["cells"] for cell in row if cell["hash"] == "empty")
    distinct_glyphs = len([k for k in res["glyphs"] if k != "empty"])

    dim_ok = cols == truth["width"] and rows == truth["height"]
    if dim_ok:
        ok += 1

    # End-to-end per-cell symbol accuracy (only meaningful when grid size matched).
    if HAS_MODEL and dim_ok:
        for r in range(rows):
            for c in range(cols):
                pred = predicted_symbol(res, res["cells"][r][c])
                tru = truth["cells"][r][c]
                cell_total += 1
                if pred == "unknown":
                    cell_unknown += 1
                elif pred == tru:
                    cell_correct += 1

    print(
        f"{name}: truth {truth['width']}x{truth['height']} | detected {cols}x{rows} "
        f"[{'OK' if dim_ok else 'DIM-MISMATCH'}] | empty truth/det {truth_empty}/{det_empty} "
        f"| distinct glyphs {distinct_glyphs}"
    )

print(f"\nGrid dimensions correct on {ok}/{len(charts)} charts.")
if HAS_MODEL and cell_total:
    acc = cell_correct / cell_total
    unk = cell_unknown / cell_total
    print(f"Per-cell symbol accuracy: {acc:.3f}  (unknown rate {unk:.3f}, n={cell_total})")
else:
    print("No trained model on disk -> classification accuracy skipped (run train.py).")
