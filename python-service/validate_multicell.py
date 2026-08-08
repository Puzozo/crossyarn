"""
Validate multi-cell (cable) span merging. We paint a continuous dark bar spanning K
cells (a stand-in for a cable's ink that crosses cell boundaries) onto clean charts and
check the pipeline merges them into one width-K symbol with the right occupiedByAnchor.

Grid size is supplied (truth W×H) to isolate the merge from grid-detection variance.

Run: cd python-service && python validate_multicell.py
"""
import glob
import json
import os

import cv2

import cv_pipeline as cvp

src = sorted(glob.glob(os.path.join("dataset", "charts", "*.png")))[:10]
out_dir = os.path.join("dataset", "charts-multicell")
os.makedirs(out_dir, exist_ok=True)
K = 4
ok = 0
n = 0

for i, png in enumerate(src):
    with open(png[:-4] + ".json", encoding="utf-8") as f:
        truth = json.load(f)
    W, H, cp, m = truth["width"], truth["height"], truth["cellPx"], truth["margin"]
    if W < K + 2 or H < 3:
        continue
    n += 1
    r0, c0 = 1, 1
    img = cv2.imread(png, cv2.IMREAD_COLOR)
    # Solid dark bar across K cells in row r0 (ink crosses every internal boundary).
    x0, y0 = m + c0 * cp, m + r0 * cp
    x1, y1 = m + (c0 + K) * cp, m + (r0 + 1) * cp
    cv2.rectangle(img, (x0 + 2, y0 + 2), (x1 - 2, y1 - 2), (30, 30, 30), -1)
    mc = os.path.join(out_dir, f"mc_{i:02d}.png")
    cv2.imwrite(mc, img)

    res = cvp.run(mc, width=W, height=H)
    # A width-K anchor with K-1 occupied cells immediately to its right, in some row.
    found = False
    for r in range(len(res["cells"])):
        for c in range(len(res["cells"][r])):
            cell = res["cells"][r][c]
            g = res["glyphs"].get(cell["hash"], {})
            if g.get("width", 1) == K and "occupiedByAnchor" not in cell:
                occ = all(
                    c + k < len(res["cells"][r])
                    and res["cells"][r][c + k].get("occupiedByAnchor") == [r, c]
                    for k in range(1, K)
                )
                if occ:
                    found = True
    ok += found
    print(f"mc_{i:02d}: painted {K}-wide bar -> detected width-{K} span: {'OK' if found else 'MISS'}")

print(f"\nMulti-cell span merge: {ok}/{n}")
