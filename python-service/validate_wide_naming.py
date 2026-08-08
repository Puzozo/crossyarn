"""
Validate end-to-end cable NAMING: charts with one real cable placed; check the pipeline
detects the span AND the wide classifier names it correctly (mappedSymbolId + width).

Grid size supplied (truth W×H) to isolate naming from grid-detection variance.
Run (after gen --wide-charts N and training model-wide): python validate_wide_naming.py
"""
import glob
import json
import os

import cv_pipeline as cvp

charts = sorted(glob.glob(os.path.join("dataset", "charts-wide", "*.png")))
if not charts:
    raise SystemExit("No wide charts. Run: npm run generate:dataset -- --wide-charts 20")

named_ok = span_ok = 0
for png in charts:
    name = os.path.basename(png)
    with open(png[:-4] + ".json", encoding="utf-8") as f:
        truth = json.load(f)
    wt = truth["wide"]
    res = cvp.run(png, width=truth["width"], height=truth["height"])

    # Find a width-`w` anchor (any row) whose glyph names the expected symbol.
    detected, correct = False, False
    for r in range(len(res["cells"])):
        for c in range(len(res["cells"][r])):
            cell = res["cells"][r][c]
            if "occupiedByAnchor" in cell:
                continue
            g = res["glyphs"].get(cell["hash"], {})
            if g.get("width", 1) == wt["w"]:
                detected = True
                if g.get("mappedSymbolId") == wt["symbolId"]:
                    correct = True
    span_ok += detected
    named_ok += correct
    print(f"{name}: expect {wt['symbolId']} (w{wt['w']}) -> span {'Y' if detected else 'n'} name {'Y' if correct else 'n'}")

print(f"\nSpan detected: {span_ok}/{len(charts)} | named correctly: {named_ok}/{len(charts)}")
