"""
Train the per-cell symbol classifier and export it to ONNX.

Consumes the synthetic dataset produced by the Node generator
(`npm run generate:dataset`) at <data>/<symbolId>/*.png — i.e. a torchvision
ImageFolder where the folder name IS the label.

Outputs (to --out, default ./model):
  symbol-classifier.onnx   — CPU inference model (loaded by classifier.py / pipeline.py)
  labels.json              — { "classes": [...], "img_size": N, "mean": .., "std": .. }
                             class index i (the ONNX logits order) → classes[i].

Run:
  pip install -r requirements-train.txt
  python train.py --data ./dataset/classifier --epochs 15
  # quick smoke test on the tiny sample dataset:
  python train.py --data ./dataset/classifier --epochs 2 --batch 32

Notes:
  - Default arch is a small from-scratch CNN (no weight download, offline-friendly).
    --arch mobilenet uses torchvision mobilenet_v3_small (downloads pretrained weights).
  - Normalization (mean/std) is persisted to labels.json and MUST match classifier.py.
"""
import argparse
import json
import os
import random

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Subset
from torchvision import datasets, transforms

MEAN = [0.5, 0.5, 0.5]
STD = [0.5, 0.5, 0.5]
SEED = 42


class TinyCNN(nn.Module):
    """Compact 3-block CNN — enough for 48x48 single-symbol crops over ~28 classes."""

    def __init__(self, num_classes: int):
        super().__init__()

        def block(i: int, o: int) -> nn.Sequential:
            return nn.Sequential(
                nn.Conv2d(i, o, 3, padding=1),
                nn.BatchNorm2d(o),
                nn.ReLU(inplace=True),
                nn.MaxPool2d(2),
            )

        self.features = nn.Sequential(block(3, 32), block(32, 64), block(64, 128))
        self.pool = nn.AdaptiveAvgPool2d(1)
        self.dropout = nn.Dropout(0.2)
        self.head = nn.Linear(128, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.features(x)
        x = self.pool(x).flatten(1)
        return self.head(self.dropout(x))


def build_model(arch: str, num_classes: int) -> nn.Module:
    if arch == "mobilenet":
        from torchvision import models

        m = models.mobilenet_v3_small(weights=models.MobileNet_V3_Small_Weights.DEFAULT)
        in_f = m.classifier[-1].in_features
        m.classifier[-1] = nn.Linear(in_f, num_classes)
        return m
    return TinyCNN(num_classes)


def make_loaders(data_dir: str, img: int, batch: int, val_split: float):
    train_tf = transforms.Compose([
        transforms.Resize((img, img)),
        transforms.RandomAffine(degrees=8, translate=(0.06, 0.06), scale=(0.9, 1.1)),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.RandomApply([transforms.GaussianBlur(3, sigma=(0.1, 1.0))], p=0.3),
        transforms.ToTensor(),
        transforms.Normalize(MEAN, STD),
    ])
    val_tf = transforms.Compose([
        transforms.Resize((img, img)),
        transforms.ToTensor(),
        transforms.Normalize(MEAN, STD),
    ])

    full_train = datasets.ImageFolder(data_dir, transform=train_tf)
    full_val = datasets.ImageFolder(data_dir, transform=val_tf)
    classes = full_train.classes

    idx = list(range(len(full_train)))
    random.Random(SEED).shuffle(idx)
    n_val = max(1, int(len(idx) * val_split))
    val_idx, train_idx = idx[:n_val], idx[n_val:]

    train_loader = DataLoader(Subset(full_train, train_idx), batch_size=batch, shuffle=True, num_workers=0)
    val_loader = DataLoader(Subset(full_val, val_idx), batch_size=batch, shuffle=False, num_workers=0)
    return train_loader, val_loader, classes


@torch.no_grad()
def evaluate(model, loader, device) -> float:
    model.eval()
    correct = total = 0
    for x, y in loader:
        x, y = x.to(device), y.to(device)
        pred = model(x).argmax(1)
        correct += (pred == y).sum().item()
        total += y.numel()
    return correct / max(1, total)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default="./dataset/classifier")
    ap.add_argument("--out", default="./model")
    ap.add_argument("--epochs", type=int, default=15)
    ap.add_argument("--batch", type=int, default=64)
    ap.add_argument("--img-size", type=int, default=48)
    ap.add_argument("--lr", type=float, default=1e-3)
    ap.add_argument("--val-split", type=float, default=0.15)
    ap.add_argument("--arch", choices=["custom", "mobilenet"], default="custom")
    args = ap.parse_args()

    if not os.path.isdir(args.data):
        raise SystemExit(f"Dataset not found: {args.data}\nRun: npm run generate:dataset")

    os.makedirs(args.out, exist_ok=True)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"device={device} arch={args.arch} data={args.data}")

    train_loader, val_loader, classes = make_loaders(args.data, args.img_size, args.batch, args.val_split)
    print(f"classes={len(classes)} train_batches={len(train_loader)} val_batches={len(val_loader)}")

    model = build_model(args.arch, len(classes)).to(device)
    opt = torch.optim.Adam(model.parameters(), lr=args.lr)
    loss_fn = nn.CrossEntropyLoss()

    best_acc, best_state = 0.0, None
    for epoch in range(1, args.epochs + 1):
        model.train()
        running = 0.0
        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            opt.zero_grad()
            loss = loss_fn(model(x), y)
            loss.backward()
            opt.step()
            running += loss.item()
        acc = evaluate(model, val_loader, device)
        print(f"epoch {epoch:02d}  loss={running / max(1, len(train_loader)):.4f}  val_acc={acc:.4f}")
        if acc >= best_acc:
            best_acc = acc
            best_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}

    if best_state:
        model.load_state_dict(best_state)
    print(f"best val_acc={best_acc:.4f}")

    # ── Persist weights first (so a failed export never loses training) ───────
    model.eval().to("cpu")
    torch.save(model.state_dict(), os.path.join(args.out, "model.pt"))

    # ── Export to ONNX ───────────────────────────────────────────────────────
    onnx_path = os.path.join(args.out, "symbol-classifier.onnx")
    dummy = torch.randn(1, 3, args.img_size, args.img_size)
    export_kwargs = dict(
        input_names=["input"],
        output_names=["logits"],
        dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}},
        opset_version=17,
    )
    try:
        # Legacy (TorchScript) exporter — no onnxscript dependency, well-tested for CNNs.
        torch.onnx.export(model, dummy, onnx_path, dynamo=False, **export_kwargs)
    except TypeError:
        # Older torch without the `dynamo` kwarg.
        torch.onnx.export(model, dummy, onnx_path, **export_kwargs)
    with open(os.path.join(args.out, "labels.json"), "w", encoding="utf-8") as f:
        json.dump({"classes": classes, "img_size": args.img_size, "mean": MEAN, "std": STD}, f, ensure_ascii=False, indent=2)
    print(f"exported {onnx_path}")

    # ── Parity check: torch vs onnxruntime on a random input ──────────────────
    try:
        import numpy as np
        import onnxruntime as ort

        sess = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
        x = np.random.randn(1, 3, args.img_size, args.img_size).astype("float32")
        onnx_pred = int(sess.run(None, {"input": x})[0].argmax(1)[0])
        with torch.no_grad():
            torch_pred = int(model(torch.from_numpy(x)).argmax(1)[0])
        ok = "OK" if onnx_pred == torch_pred else "MISMATCH"
        print(f"onnx parity: torch={torch_pred} onnx={onnx_pred} [{ok}]")
    except Exception as e:  # noqa: BLE001
        print(f"parity check skipped: {e}")


if __name__ == "__main__":
    main()
