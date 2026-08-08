# crossyarn-import — recognition service (Workstream A)

CPU-only Python sidecar that turns a chart image into a Crossyarn `ImportResult`.
Runs as a **second PM2 process**, bound to **127.0.0.1** only. Next.js talks to it over
loopback; results come back via an authenticated callback. It is never exposed publicly.

> **Status (validated on the synthetic charts with ground truth):**
> - **Grid detection + segmentation** (`cv_pipeline.py`) — symbolic 40/40 exact, colour 19/20.
> - **Empty-cell detection** — perfect (`validate_grid.py`).
> - **Symbol classifier** — TinyCNN trained (`train.py`, val acc 0.9995, ONNX + parity OK);
>   end-to-end per-cell symbol accuracy **0.79** on the 40 charts.
> - **Colour (jacquard) detection** (`color.py`) — per-cell colour-identity **1.000**,
>   palette size exact 19/20 (`validate_color.py`). Auto-dispatched by saturation.
> - **Legend matcher** (`legend.py`) — text→symbol matching 24/24 exact + 10/10 noisy
>   (`validate_legend.py`); used as a prior when the CNN is unsure.
>
> - **Perspective correction** (`deskew.py`) — Otsu document-scanner warp; runs before
>   grid detection (no-op for flat scans, so symbolic/colour are unaffected). Rectifies a
>   cleanly-detected chart quad, but on the synthetic warped set auto grid-recovery is weak
>   (1/12; ~0.31 cell-acc even with manual W×H): corner detection isn't pixel-precise and
>   faint synthetic lines + warp blur compound. See "Remaining" for the robust path.
>
> - **Multi-cell symbols** (`_merge_multicell`) — adjacent cells whose ink crosses the
>   boundary merge into one wide symbol; the full path (preview span + save + editor)
>   works via `occupiedByAnchor`. With no wide model: conservative ink-merge → wide Unknown.
> - **Cable NAMING via a wide CNN** (`train.py --data dataset/wide` → `model-wide/`,
>   `classifier.classify_wide`) — a 5-class model (cable-4, cable-6, k3tog-wide, p3tog-wide,
>   **other**), val_acc 1.0. The "other" negative class lets it REJECT neighbouring single
>   symbols, so a low candidate threshold catches cables WITHOUT false-merging singles
>   (symbolic stays 0.79). On detected spans, naming precision was 9/9 (`validate_wide_naming.py`);
>   recall ~45% on the synthetic test (domain gap: test cables drawn with grid lines/scale
>   differing from the training crops — real platform charts fare better).
> - **Colour palette** is returned in `ImportResult.palette` and applied to the saved
>   pattern's swatches in the Next preview.
>
> **Remaining:** legend OCR needs the `tesseract` binary on the host (matcher + wiring
> are done and degrade gracefully without it); improve cable-span RECALL (the wide CNN
> names confidently but the candidate detector + synthetic domain gap miss ~half);
> **robust photo import** — the auto perspective warp is best-effort; reliable handling
> needs a **manual 4-corner adjust in the preview UI** (drag corners → warp), which is the
> standard scanner approach and far more dependable than auto corner detection. The
> `deskewFailed` flag + a `redetect` that accepts corner points are the hooks for it.
> Auto-detection should also be re-tuned on REAL labelled photos, not synthetic warps.
>
> The Next.js web layer also works today via the built-in JS mock
> (`src/lib/import-pipeline/mock-recognizer.ts`): leave `IMPORT_PYTHON_URL` unset to use
> the mock, set it to this service to use the real pipeline.

## Architecture

```
Next POST /api/imports → job PENDING → queue dispatch
   → (IMPORT_PYTHON_URL set) Next POSTs 127.0.0.1:8001/process {jobId, imageRef, width?, height?}
        ↳ this service: preprocess → grid-detect → segment → classify → OCR legend → build ImportResult
        ↳ PATCH {NEXT_URL}/api/internal/imports/{jobId}  (header X-Internal-Key)  {status, result|errorType}
   → Next completeJob() → job READY → browser polling shows the preview
```

## Env

| var | meaning |
|---|---|
| `INTERNAL_API_KEY` | shared secret; must equal the value Next has. Sent on every callback. |
| `NEXT_CALLBACK_URL` | e.g. `http://127.0.0.1:3000` — where to PATCH job results. |
| `IMPORT_UPLOAD_DIR` | same dir Next writes uploads to (`imageRef` is a bare filename in it). |
| `MODEL_PATH` | path to the ONNX symbol classifier (phase 2). |

On the Next side set `IMPORT_PYTHON_URL=http://127.0.0.1:8001` to switch off the mock.

## Run (dev)

```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --host 127.0.0.1 --port 8001
```

## PM2 (prod)

```bash
pm2 start "uvicorn app:app --host 127.0.0.1 --port 8001" --name crossyarn-import
```
Caddy must NOT proxy port 8001 and must block `/api/internal/*` from the public listener.

## Training data (synthetic, from our own symbols)

We do **not** scrape real charts (copyright + unlabelled + too few). Instead we render
unlimited, perfectly-labelled, class-balanced samples from the 28 canonical symbols.

The generator is **Node** (reuses the exact `canvas` vector drawings the app ships with —
`scripts/symbol-drawings.ts`), so the synthetic glyphs match our rendering by construction:

```bash
# from the Next.js project root
npm run generate:dataset -- --per-class 800 --charts 40
# output (gitignored): python-service/dataset/
#   classifier/<symbolId>/NNNN.png   ← augmented cell crops, folder = label
#   charts/chart_NN.png + .json      ← full charts + per-cell ground truth
#   manifest.json
```

Augmentations: paper/scan backgrounds, ink-colour + stroke jitter, rotation/scale/translation,
gaussian noise, optional blur, faint grid lines.

Training (this side) — `train.py`:
```bash
pip install -r requirements-train.txt
python train.py --data ./dataset/classifier --epochs 15        # → ./model/
# quick smoke test on the tiny sample set:
python train.py --data ./dataset/classifier --epochs 2 --batch 32
```
`train.py` does ImageFolder load → train/val split → CNN (`--arch custom` from-scratch,
or `mobilenet` transfer) → exports `model/symbol-classifier.onnx` + `model/labels.json`
(class-index order) and runs a torch-vs-onnxruntime parity check.

Inference: `classifier.py` loads that ONNX via `onnxruntime` (CPU) and exposes
`classify(cell) -> (symbol_id, confidence)`; `pipeline.py` calls it per cell once grid
detection + segmentation are implemented (`classifier.is_available()` guards it).
Set `MODEL_PATH` to point at the `.onnx`. `charts/*.json` are the ground truth for
grid-detection + end-to-end accuracy.

> Domain gap caveat: a model trained only on our exact glyphs may under-generalize to
> foreign notations — that's expected. Augmentation narrows it; everything still
> unmatched becomes an **Unknown** glyph by design. Add a small hand-labelled real-chart
> validation set before trusting accuracy numbers.

## Files
- `app.py` — FastAPI: `/process` endpoint, internal-key guard, result callback.
- `pipeline.py` — orchestrator: `recognize()` → `cv_pipeline.run()`.
- `cv_pipeline.py` — OpenCV preprocess → grid detection (symbolic: morphology lines;
  colour: gradient + autocorrelation period; W×H hint → uniform partition) → segmentation →
  ink-density empty split → colour analysis → legend prior → CNN classification →
  Hamming-tolerant Unknown dedup → `ImportResult`.
- `color.py` — saturation-gated jacquard colour detection + k-means palette.
- `legend.py` — legend region detection, OCR (pytesseract, tesseract-gated), and the
  pure-Python text→symbol matcher (`match_symbol`).
- `deskew.py` — Otsu-based perspective (document-scanner) correction for photos.
- `validate_grid.py` / `validate_color.py` / `validate_legend.py` / `validate_perspective.py`
  / `validate_wide_naming.py` — ground-truth checks (perspective pairs with `gen_warp_test.py`).
- `dataset_synth.py` — Python-native dataset stub; superseded by `scripts/gen-symbol-dataset.ts`
  (Node), which is the canonical generator. Training consumes `./dataset/classifier`.
