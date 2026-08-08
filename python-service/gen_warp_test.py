"""
Generate perspective-warped 'photos' of clean symbolic charts for validating
deskew.correct_perspective. Each clean chart (charts/*.png) is pasted onto a larger
grey background under a random homography; the ground truth (cells/dims) is unchanged.

Run: cd python-service && python gen_warp_test.py [N]
"""
import glob
import json
import os
import sys

import cv2
import numpy as np

N = int(sys.argv[1]) if len(sys.argv) > 1 else 12
src_charts = sorted(glob.glob(os.path.join("dataset", "charts", "*.png")))[:N]
out_dir = os.path.join("dataset", "charts-warp")
os.makedirs(out_dir, exist_ok=True)
rng = np.random.default_rng(7)

for i, png in enumerate(src_charts):
    chart = cv2.imread(png, cv2.IMREAD_COLOR)
    ch, cw = chart.shape[:2]
    bw, bh = int(cw * 1.6), int(ch * 1.6)

    # Grey, slightly noisy "table" background.
    bg = np.full((bh, bw, 3), 120, dtype=np.uint8)
    bg = cv2.add(bg, rng.integers(-12, 12, (bh, bw, 3), dtype=np.int16).astype(np.int16).clip(-255, 255).astype(np.uint8))

    src = np.array([[0, 0], [cw - 1, 0], [cw - 1, ch - 1], [0, ch - 1]], dtype="float32")
    mx, my, jit = 0.16, 0.16, 0.06
    base = np.array([
        [bw * mx, bh * my], [bw * (1 - mx), bh * my],
        [bw * (1 - mx), bh * (1 - my)], [bw * mx, bh * (1 - my)],
    ], dtype="float32")
    jitter = rng.uniform(-1, 1, (4, 2)) * np.array([bw * jit, bh * jit])
    dst = (base + jitter).astype("float32")

    M = cv2.getPerspectiveTransform(src, dst)
    warped = cv2.warpPerspective(chart, M, (bw, bh))
    mask = cv2.warpPerspective(np.full((ch, cw), 255, np.uint8), M, (bw, bh))
    bg[mask > 0] = warped[mask > 0]

    base_name = f"warp_{i:02d}"
    cv2.imwrite(os.path.join(out_dir, base_name + ".png"), bg)
    with open(png[:-4] + ".json", encoding="utf-8") as f:
        truth = json.load(f)
    with open(os.path.join(out_dir, base_name + ".json"), "w", encoding="utf-8") as f:
        json.dump(truth, f)

print(f"Wrote {len(src_charts)} warped charts -> {out_dir}")
