"""
Synthetic dataset generator for the symbol classifier (scaffold).

Our advantage: we own 28 canonical symbols as SVGs (src/lib/patterns/builtin-icons.ts,
base64-encoded). Rendering them with randomized augmentations yields a labelled training
set without hand-annotating real charts.

Pipeline (TODO to flesh out):
  1. Extract the 28 base64 SVGs from builtin-icons.ts (or export them to ./symbols/*.svg).
  2. Rasterize each at the target cell size (e.g. 48x48) — cairosvg / resvg / Pillow.
  3. For each, generate N augmented variants:
       - gaussian noise, blur, JPEG artifacts
       - scale / translation / small rotation
       - stroke-weight & contrast jitter, background tint (paper/scan)
       - alternate fonts for glyph-style symbols
  4. Write images to ./dataset/<label>/<i>.png  (label = our symbol id).
  5. Train a small MobileNet-class CNN; export to ONNX (MODEL_PATH) for CPU inference.

Run:
    python dataset_synth.py --out ./dataset --per-class 800
"""
import argparse

# Our 28 symbol ids (keep in sync with DEFAULT_SYMBOLS in src/lib/patterns/model.ts).
SYMBOL_IDS = [
    "knit", "purl", "yarn-over", "purl-in-yarn-over", "cross-purl", "cross-knit",
    "k2tog-left", "k2tog-right", "p2tog-left", "p2tog-right", "k3tog", "p3tog",
    "slip-back", "slip-front", "two-from-one", "three-from-one", "four-from-one",
    "four-together", "five-from-one", "five-together", "five-knit", "wrap", "bobble",
    "empty", "k3tog-wide", "p3tog-wide", "cable-4", "cable-6",
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="./dataset")
    parser.add_argument("--per-class", type=int, default=800)
    args = parser.parse_args()

    print(f"[scaffold] would render {len(SYMBOL_IDS)} classes "
          f"× {args.per_class} augmented variants into {args.out}")
    print("[scaffold] implement: SVG → raster → augment → write; then train + export ONNX.")
    # TODO: real generation + training loop.


if __name__ == "__main__":
    main()
