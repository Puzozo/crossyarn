"""
Recognition pipeline (scaffold).

Stages mirror the contract in src/lib/import-pipeline/contracts.ts:
  uploaded → preprocessed → grid-detected → segmented → converted → ready

The return value MUST match the TypeScript `ImportResult` shape so the Next.js
preview can consume it unchanged:

  {
    "stages": [...],
    "suggestedTitle": str,
    "grid": {"width": int, "height": int},
    "cells": [[{"hash": str, "color": "#rrggbb", "confidence": float,
                "occupiedByAnchor": [r, c] | omitted}], ...],
    "glyphs": { hash: {"hash","image"(dataURI),"mappedSymbolId"|null,"description"?,
                       "suggestedName","width","height","occurrences"} },
    "legendDetected": bool,
    "deskewFailed": bool,
    "lowConfidenceCount": int,
    "confidenceThreshold": float
  }

TODO (the actual ML work):
  1. preprocess: load (Pillow/OpenCV), grayscale, denoise, deskew, contrast-normalize.
  2. detect_grid: Hough lines / contour analysis → cell bounding boxes; perspective
     correction for photos (set deskew_failed when 4-corner input is needed).
  3. segment: crop each cell; crop legend region if present.
  4. classify: per cell call classifier.classify(crop) — the ONNX CNN trained by
     train.py on the synthetic dataset (classifier.is_available() guards it). Apply a
     confidence threshold; legend OCR (pytesseract) to read glyph↔description;
     perceptual-hash dedup of distinct glyphs; map to our symbol ids, else emit an
     Unknown glyph crop.
  5. convert: assemble the ImportResult above, clamping grid to <= 200x200.
"""
from typing import Optional

CONFIDENCE_THRESHOLD = 0.7
MAX_DIM = 200


def recognize(image_path: str, width: Optional[int] = None, height: Optional[int] = None) -> dict:
    """Entry point called by app.py.

    Runs the OpenCV grid-detection + segmentation pipeline (cv_pipeline.run), which
    classifies each non-empty cell with the ONNX model when present, else emits Unknown
    glyph crops. `width`/`height` are the user's redetect hints (uniform partition).

    Raises FileNotFoundError if the image is missing (→ Next marks the job invalid-image).
    """
    import os
    if not os.path.exists(image_path):
        raise FileNotFoundError(image_path)

    import cv_pipeline
    return cv_pipeline.run(image_path, width, height)
