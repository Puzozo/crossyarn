"""
Symbol classifiers — load ONNX models trained by train.py and classify a crop.

Two models share the same code:
  - single-cell  (model/symbol-classifier.onnx)      → classify(cell)
  - wide / cable (model-wide/symbol-classifier.onnx)  → classify_wide(spanCrop)

Preprocessing (resize→normalize) and the label order come from each model's labels.json
and MUST match train.py.
"""
import json
import os
from functools import lru_cache
from typing import Tuple

import numpy as np
from PIL import Image

MODEL_PATH = os.environ.get("MODEL_PATH", "./model/symbol-classifier.onnx")
LABELS_PATH = os.environ.get("LABELS_PATH", os.path.join(os.path.dirname(MODEL_PATH), "labels.json"))

WIDE_MODEL_PATH = os.environ.get("WIDE_MODEL_PATH", "./model-wide/symbol-classifier.onnx")
WIDE_LABELS_PATH = os.environ.get("WIDE_LABELS_PATH", os.path.join(os.path.dirname(WIDE_MODEL_PATH), "labels.json"))


@lru_cache(maxsize=4)
def _load(model_path: str, labels_path: str):
    import onnxruntime as ort

    with open(labels_path, "r", encoding="utf-8") as f:
        meta = json.load(f)
    sess = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
    return sess, meta["classes"], int(meta["img_size"]), np.array(meta["mean"], "float32"), np.array(meta["std"], "float32")


def _classify(model_path: str, labels_path: str, img: Image.Image) -> Tuple[str, float]:
    sess, classes, size, mean, std = _load(model_path, labels_path)
    arr = np.asarray(img.convert("RGB").resize((size, size)), dtype="float32") / 255.0
    arr = ((arr - mean) / std).transpose(2, 0, 1)[None, :, :, :].astype("float32")
    logits = sess.run(None, {"input": arr})[0][0]
    e = np.exp(logits - logits.max())
    probs = e / e.sum()
    i = int(probs.argmax())
    return classes[i], float(probs[i])


# ── single-cell ──────────────────────────────────────────────────────────────
def classify(cell: Image.Image) -> Tuple[str, float]:
    return _classify(MODEL_PATH, LABELS_PATH, cell)


def is_available() -> bool:
    return os.path.exists(MODEL_PATH) and os.path.exists(LABELS_PATH)


# ── wide / cable ───────────────────────────────────────────────────────────────
def classify_wide(span_crop: Image.Image) -> Tuple[str, float]:
    return _classify(WIDE_MODEL_PATH, WIDE_LABELS_PATH, span_crop)


def wide_available() -> bool:
    return os.path.exists(WIDE_MODEL_PATH) and os.path.exists(WIDE_LABELS_PATH)


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("usage: python classifier.py <cell-image.png>")
        raise SystemExit(2)
    print(classify(Image.open(sys.argv[1])))
