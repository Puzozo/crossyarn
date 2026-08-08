"""
Validate perspective correction: run the full pipeline on warped 'photos' and check the
recovered grid size matches the original (unwarped) ground truth.

Run (after gen_warp_test.py): cd python-service && python validate_perspective.py
"""
import glob
import json
import os

import cv_pipeline as cvp

charts = sorted(glob.glob(os.path.join("dataset", "charts-warp", "*.png")))
if not charts:
    raise SystemExit("No warped charts. Run: python gen_warp_test.py")

def predicted(res, cell):
    if cell["hash"] == "empty":
        return "empty"
    return res["glyphs"].get(cell["hash"], {}).get("mappedSymbolId") or "unknown"


def cell_accuracy(res, truth):
    cor = tot = 0
    for r in range(truth["height"]):
        for c in range(truth["width"]):
            tot += 1
            if predicted(res, res["cells"][r][c]) == truth["cells"][r][c]:
                cor += 1
    return cor / max(1, tot)


dim_ok = 0
hint_acc_sum = 0.0
for png in charts:
    name = os.path.basename(png)
    with open(png[:-4] + ".json", encoding="utf-8") as f:
        truth = json.load(f)

    # Pass 1: fully automatic (perspective correct + auto grid).
    try:
        auto = cvp.run(png)
        cols, rows = auto["grid"]["width"], auto["grid"]["height"]
        ok = cols == truth["width"] and rows == truth["height"]
    except Exception:  # noqa: BLE001
        cols = rows = 0
        ok = False
    dim_ok += ok

    # Pass 2: perspective correct + manual W×H (the real photo UX via the re-detect UI).
    try:
        hinted = cvp.run(png, width=truth["width"], height=truth["height"])
        acc = cell_accuracy(hinted, truth)
    except Exception:  # noqa: BLE001
        acc = 0.0
    hint_acc_sum += acc

    print(f"{name}: truth {truth['width']}x{truth['height']} | auto {cols}x{rows} "
          f"[{'OK' if ok else 'miss'}] | with-W×H cell-acc {acc:.2f}")

print(f"\nAuto grid recovered: {dim_ok}/{len(charts)}")
print(f"With manual W×H (rectified): mean per-cell symbol accuracy {hint_acc_sum / len(charts):.3f}")
